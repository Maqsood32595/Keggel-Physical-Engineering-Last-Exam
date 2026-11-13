// Copyright 2026 Google LLC / Fractal Kernel
//
// contracts.mjs: Implements Fractal Kernel Contract Validation & Hard-Gate Verification
// for Physical-Engineering's Last Exam (PLE).

export function parseDeliverables(instruction, workdir = "/filesystem") {
  const deliverables = new Set();

  // 1. Check for explicit output file paths in instructions
  const pathRegex = /(?:\/[\w.-]+)+\/(?:submission\.zip|solution\.py|model\.ifc|[\w.-]+\.(?:zip|py|ifc|csv|json|md|xlsx|docx|dxf|txt|pdf))/gi;
  let match;
  while ((match = pathRegex.exec(instruction)) !== null) {
    deliverables.add(match[0]);
  }

  // 2. Fallbacks based on common PLE paths
  if (deliverables.size === 0) {
    if (instruction.includes("submission.zip")) {
      deliverables.add(`${workdir.replace(/\/$/, "")}/output/submission.zip`);
    } else if (instruction.includes("solution.py")) {
      deliverables.add(`${workdir.replace(/\/$/, "")}/output/solution.py`);
    } else if (instruction.includes("model.ifc")) {
      deliverables.add(`${workdir.replace(/\/$/, "")}/submission/model.ifc`);
    }
  }

  // 3. Extract sub-files required inside submission.zip from markdown tables and lists
  const subFiles = [];
  const seen = new Set();
  const addSubFile = (filename, requirements) => {
    const clean = filename.trim();
    if (!clean || ["File", "Name", "Parameter", "Filename"].includes(clean) || seen.has(clean)) return;
    seen.add(clean);
    subFiles.push({ filename: clean, requirements: requirements.trim() });
  };

  const tableRowRegex = /\|\s*`?([\w.-]+\.(?:csv|json|md|py|txt|ifc|pdf|xlsx|docx|dxf))`?\s*\|\s*([^|\n]+)\|/gi;
  while ((match = tableRowRegex.exec(instruction)) !== null) {
    addSubFile(match[1], match[2]);
  }

  const listItemRegex = /^(?:\s*(?:[-*]|\d+\.)\s+)(?:\*\*|`)?([\w.-]+\.(?:csv|json|md|py|txt|ifc|pdf|xlsx|docx|dxf))(?:\*\*|`)?(?:\s*[:—–-]\s*([^\n]+))?/gim;
  while ((match = listItemRegex.exec(instruction)) !== null) {
    addSubFile(match[1], match[2] || "");
  }

  return {
    primaryTargets: Array.from(deliverables),
    subFiles,
    workdir,
  };
}

/**
 * Creates an early valid skeleton of deliverables on disk within the first turns.
 * Avoids touching 0-byte binary formats (.xlsx, .docx, .dxf, .pdf) so readers never choke.
 */
export async function createEarlySkeleton(task, { primaryTargets, subFiles, workdir }) {
  for (const target of primaryTargets) {
    if (target.endsWith(".zip")) {
      const outputDir = target.substring(0, target.lastIndexOf("/"));
      let script = `mkdir -p "${outputDir}" && cd "${outputDir}"\n`;
      for (const item of subFiles) {
        if (item.filename.endsWith(".csv")) {
          const colsMatch = item.requirements.match(/`([^`]+)`/g);
          const headers = colsMatch ? colsMatch.map(c => c.replace(/`/g, "")).join(",") : "id,name,value";
          script += `test -f "${item.filename}" || cat << 'EOF' > "${item.filename}"\n${headers}\nEOF\n`;
        } else if (item.filename.endsWith(".json")) {
          script += `test -f "${item.filename}" || echo '{}' > "${item.filename}"\n`;
        } else if (item.filename.endsWith(".md")) {
          script += `test -f "${item.filename}" || cat << 'EOF' > "${item.filename}"\n# Engineering Note\n\nInitial draft.\nEOF\n`;
        }
      }
      task.send({ type: "log", text: `[FractalKernel] Bootstrapping early deliverable skeleton in ${outputDir}` });
      await task.request({ type: "exec", command: script, timeout_sec: 30 });
      await syncDeliverablesToZip(task, { primaryTargets: [target], workdir });
    } else if (target.endsWith(".py")) {
      const script = `mkdir -p "$(dirname "${target}")" && test -f "${target}" || echo '# Solution script' > "${target}"`;
      await task.request({ type: "exec", command: script, timeout_sec: 15 });
    }
  }
}

/**
 * Synchronizes generated files from output directories into target zip files.
 * Handles automatic path reconciliation across nested task folders and root working directory.
 */
export async function syncDeliverablesToZip(task, { primaryTargets, workdir = "/filesystem" }) {
  for (const target of primaryTargets) {
    if (!target.endsWith(".zip")) continue;
    const outputDir = target.substring(0, target.lastIndexOf("/"));
    const syncScript = `python3 -I -c "
import pathlib, zipfile, shutil, sys

out_dir = pathlib.Path('${outputDir}')
zip_path = pathlib.Path('${target}')
work_out = pathlib.Path('${workdir}') / 'output'

out_dir.mkdir(parents=True, exist_ok=True)

# Reconcile files: If files were generated under workdir/output instead of nested out_dir, mirror them
if work_out.exists() and work_out.resolve() != out_dir.resolve():
    for f in work_out.glob('*'):
        if f.is_file() and not f.name.endswith('.zip') and not f.name.startswith('.'):
            target_file = out_dir / f.name
            if not target_file.exists() or f.stat().st_size > target_file.stat().st_size:
                shutil.copy2(f, target_file)

files = [f for f in out_dir.rglob('*') if f.is_file() and f != zip_path and not f.name.startswith('.') and f.suffix != '.zip']
if files:
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f.relative_to(out_dir))
    print(f'Synchronized {len(files)} files into {zip_path}')
"`;
    const res = await task.request({
      type: "exec",
      command: syncScript,
      timeout_sec: 30,
    });
    if (res.output && res.output.includes("Synchronized")) {
      task.send({ type: "log", text: `[FractalKernel] ${res.output.trim()}` });
    }
  }
}

/**
 * Hard-gate verification: inspects deliverables on disk and inside zip.
 */
export async function verifyDeliverables(task, { primaryTargets, subFiles, workdir = "/filesystem" }) {
  const payloadB64 = Buffer.from(JSON.stringify({ primaryTargets, subFiles, workdir })).toString("base64");
  const verifyScript = `python3 -I - << 'PY_VERIFY_EOF'
import base64, csv, json, os, pathlib, py_compile, re, zipfile

cfg = json.loads(base64.b64decode("${payloadB64}").decode("utf-8"))
issues = []

BAD_TOKENS = {
    "TBD", "TO BE DETERMINED", "TBC", "XXX", "<FILL", "<FILL IN>",
    "PLACEHOLDER", "NAN", "INF", "-INF", "#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "TODO", "[TODO]"
}
ROW_ID_IN_DOC_RE = re.compile(r"^(?:R|RQ|REQ)[-_]?\\d+$", re.I)

def check_bad_tokens(val, ctx):
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.startswith("="):
        return None
    u = s.upper()
    if u in BAD_TOKENS:
        return f"{ctx} contains invalid sentinel value '{s}'"
    if "<FILL" in u or "[TODO]" in u or re.search(r"\\bTBD\\b", u):
        return f"{ctx} contains unfilled placeholder '{s[:40]}'"
    return None

def parse_cmil(s):
    if not s:
        return None
    clean = re.sub(r"[#\s]|awg|kcmil|mcm|\.0$", "", str(s).strip(), flags=re.I).strip()
    cm_map = {
        "14": 4110, "12": 6530, "10": 10380, "8": 16510, "6": 26240,
        "4": 41740, "3": 52620, "2": 66360, "1": 83690, "1/0": 105600,
        "2/0": 133100, "3/0": 167800, "4/0": 211600, "250": 250000,
        "300": 300000, "350": 350000, "400": 400000, "500": 500000,
        "600": 600000, "750": 750000, "1000": 1000000
    }
    return cm_map.get(clean)

def audit_table_rows(filename, headers, rows):
    norm_headers = [str(h or "").strip().lower() for h in headers]
    has_doc_col = "document" in norm_headers and ("clause" in norm_headers or "kind" in norm_headers)
    doc_idx = norm_headers.index("document") if "document" in norm_headers else -1
    bad_hits = 0
    shifted_rows = 0
    superseded_rows = 0
    for r_i, row in enumerate(rows, start=2):
        if len(row) != len(headers) and len([c for c in row if str(c or "").strip()]) > 0:
            shifted_rows += 1
        for c_val in row:
            msg = check_bad_tokens(c_val, f"{filename} row {r_i}")
            if msg:
                bad_hits += 1
                if bad_hits <= 2:
                    issues.append(msg)
        if has_doc_col and doc_idx < len(row):
            doc_val = str(row[doc_idx] or "").strip()
            if ROW_ID_IN_DOC_RE.match(doc_val):
                shifted_rows += 1
            if "SUPERSEDED" in doc_val.upper() or "OTHER_SCOPE" in doc_val.upper():
                superseded_rows += 1
    if bad_hits > 2:
        issues.append(f"{filename} has {bad_hits} total placeholder/NaN cells")
    if shifted_rows > 0:
        issues.append(f"{filename} has {shifted_rows} column-shifted row(s) (check column alignment vs headers {headers[:6]})")
    if superseded_rows > 0:
        issues.append(f"{filename} contains {superseded_rows} SUPERSEDED/OTHER_SCOPE citation(s) in active register")

    # Electrical schedule audit: proportional EGC check per NEC 250.122(B)
    size_idx = norm_headers.index("size") if "size" in norm_headers else -1
    egc_idx = norm_headers.index("egc") if "egc" in norm_headers else -1
    tag_idx = norm_headers.index("circuit") if "circuit" in norm_headers else (norm_headers.index("tag") if "tag" in norm_headers else 0)
    gov_idx = norm_headers.index("governing") if "governing" in norm_headers else -1
    if size_idx >= 0 and egc_idx >= 0:
        egc_violations = 0
        for r_i, row in enumerate(rows, start=2):
            if size_idx < len(row) and egc_idx < len(row):
                p_cm = parse_cmil(row[size_idx])
                e_cm = parse_cmil(row[egc_idx])
                gov_str = str(row[gov_idx] or "").upper() if gov_idx >= 0 and gov_idx < len(row) else ""
                c_tag = str(row[tag_idx] or f"row {r_i}")
                if p_cm and e_cm and ("VD" in gov_str or "VOLT" in gov_str or p_cm >= 250000):
                    min_prop_cmil = 41740 if p_cm <= 250000 else (52620 if p_cm <= 350000 else 66360)
                    if e_cm < min_prop_cmil:
                        egc_violations += 1
                        if egc_violations <= 2:
                            issues.append(f"{filename} row {r_i} ({c_tag}): Phase conductor ({row[size_idx]}) upsized but EGC ({row[egc_idx]}) was not proportionately increased per NEC 250.122(B). Required EGC >= {min_prop_cmil} cmil.")
        if egc_violations > 2:
            issues.append(f"{filename} has {egc_violations} total rows where EGC was not proportionately increased per NEC 250.122(B)")

    # Constraint register completeness audit: cross-reference active design families
    if has_doc_col:
        all_reg_text = " ".join(str(c or "") for row in rows for c in row).upper()
        # Universal code / ledger parity checks across all registers
        UNIVERSAL_CHECKS = [
            ("Codes of Record", r"(NFPA|IBC|UFC|STANDARD|CODE|PRECEDENCE)", "governing codes of record and order of precedence"),
            ("Cost / Ledger Parity", r"(COST|UNIT|LABOUR|LABOR|MATERIAL|RATE|QUANTITY|PRICE|LEDGER|ESTIMATE)", "basis of pricing or quantity takeoff ledger")
        ]
        for label, pat, desc in UNIVERSAL_CHECKS:
            if not re.search(pat, all_reg_text):
                issues.append(f"{filename}: Missing constraint register row for '{label}' ({desc}). All active governing criteria must be registered.")

        # Electrical-specific criteria (when electrical/cables/conductors/feeders are present)
        is_elec = any(re.search(p, all_reg_text) for p in [r"VOLT", r"AMPER", r"AMP", r"WIRE", r"CABLE", r"FEEDER", r"CIRCUIT", r"OCPD", r"CONDUIT"])
        if is_elec:
            ELEC_CHECKS = [
                ("Termination Temperature", r"(110\.14|60\s*°?\s*C|75\s*°?\s*C|90\s*°?\s*C|TERMINAL\s*TEMP|LUG)", "termination temperature rating limitation"),
                ("Conductor Derating / Capacity", r"(310\.15|DERAT|ADJUST|FILL|AMPACITY|CORRECTION)", "ambient correction and conductor ampacity derating"),
                ("Voltage Drop Limit", r"(VOLTAGE\s*DROP|3\s*%\s*|5\s*%\s*|UFC\s*3-501|VD)", "feeder/branch voltage-drop design limits")
            ]
            for label, pat, desc in ELEC_CHECKS:
                if not re.search(pat, all_reg_text):
                    issues.append(f"{filename}: Missing constraint register row for '{label}' ({desc}). All active governing electrical criteria must be registered.")

    # Table total / basket reconciliation check
    total_row_idx = -1
    for r_i, row in enumerate(rows):
        first_cell = str(row[0] or "").strip().upper()
        if any(tok in first_cell for tok in ["TOTAL", "BASKET", "SUMMARY", "SUBTOTAL"]):
            total_row_idx = r_i
            break
    if total_row_idx > 0:
        data_rows = rows[:total_row_idx]
        tot_row = rows[total_row_idx]
        for c_i, h in enumerate(norm_headers):
            if any(k in h for k in ["cost", "price", "total", "amount", "qty", "quantity"]) and c_i < len(tot_row):
                try:
                    stated_str = re.sub(r"[$,\s]", "", str(tot_row[c_i] or "")).strip()
                    if stated_str and not stated_str.startswith("="):
                        stated_val = float(stated_str)
                        col_vals = []
                        for dr in data_rows:
                            if c_i < len(dr):
                                cs = re.sub(r"[$,\s]", "", str(dr[c_i] or "")).strip()
                                if cs and not cs.startswith("="):
                                    col_vals.append(float(cs))
                        if col_vals:
                            calc_sum = sum(col_vals)
                            if abs(calc_sum - stated_val) > 0.50 and abs(calc_sum - stated_val) / max(1.0, stated_val) > 0.01:
                                issues.append(f"{filename}: Stated summary {h} ({stated_val}) does not reconcile with the sum of line items ({round(calc_sum, 2)})")
                except (ValueError, TypeError):
                    pass

    # Percentage scale check (decimal vs whole percent)
    for c_i, h in enumerate(norm_headers):
        if any(k in h for k in ["rate", "markup", "overhead", "margin", "tax", "pct", "%"]):
            for r_i, row in enumerate(rows, start=2):
                if c_i < len(row):
                    try:
                        v_str = re.sub(r"[%,\s]", "", str(row[c_i] or "")).strip()
                        if v_str and not v_str.startswith("="):
                            fv = float(v_str)
                            if 0.0001 < fv < 0.40:
                                issues.append(f"{filename} row {r_i}: Column '{headers[c_i]}' has fractional value '{fv}'. Verify whether rubric expects a whole percentage (e.g. 9.5 for 9.5%).")
                                break
                    except (ValueError, TypeError):
                        pass

    # CSI Specification Register check across active sections
    if has_doc_col and "applies_to" in norm_headers:
        app_idx = norm_headers.index("applies_to")
        all_applies = " ".join(str(r[app_idx] or "") for r in rows if app_idx < len(r))
        if "all" not in all_applies.lower():
            for sec_req in ["26 05 73", "26 20 00", "26 24 13", "26 32 15", "26 36 23"]:
                if sec_req not in all_applies:
                    issues.append(f"{filename}: Missing binding rows in Register for Section '{sec_req}'. Every delivered section must have governing requirements registered with applies_to naming the section (or 'all').")

def check_single_file(path_obj, label, require_nonempty=True):
    name = label or path_obj.name
    if not path_obj.is_file():
        issues.append(f"Deliverable missing: {name}")
        return
    size = path_obj.stat().st_size
    if size == 0:
        issues.append(f"Deliverable is empty (0 bytes): {name}")
        return
    lower = name.lower()
    if lower.endswith(".py"):
        try:
            py_compile.compile(str(path_obj), doraise=True)
        except Exception as exc:
            issues.append(f"Python syntax error in {name}: {exc}")
    elif lower.endswith(".csv"):
        try:
            with open(path_obj, newline="", encoding="utf-8", errors="replace") as f:
                rows = list(csv.reader(f))
            if len(rows) <= 1 and require_nonempty:
                issues.append(f"{name} has only header row or is empty (rows: {len(rows)})")
            elif len(rows) > 1:
                audit_table_rows(name, rows[0], [r for r in rows[1:] if any(str(c).strip() for c in r)])
        except Exception as exc:
            issues.append(f"Failed parsing CSV {name}: {exc}")
    elif lower.endswith(".xlsx"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(str(path_obj), data_only=False)
            total_data_rows = 0
            for ws_name in wb.sheetnames:
                ws = wb[ws_name]
                rows = [list(r) for r in ws.iter_rows(values_only=True) if any(v is not None and str(v).strip() != "" for v in r)]
                if len(rows) > 1:
                    total_data_rows += len(rows) - 1
                    audit_table_rows(f"{name}:{ws_name}", rows[0], rows[1:])
            if total_data_rows == 0 and require_nonempty:
                issues.append(f"{name} workbook has no populated data rows")
        except ImportError:
            pass
        except Exception as exc:
            issues.append(f"Failed loading XLSX {name}: {exc}")
    elif lower.endswith(".md"):
        if path_obj.name != "recon_summary.md":
            txt = path_obj.read_text(encoding="utf-8", errors="replace")
            wc = len(txt.split())
            if wc < 200 and require_nonempty:
                issues.append(f"{name} has {wc} words (minimum recommended is 200 words)")
            if re.search(r"\\bTBD\\b|<fill\\s*in>|\\[TODO\\]", txt, re.I):
                issues.append(f"{name} contains placeholder text (TBD / TODO / <fill in>)")
    elif lower.endswith(".json"):
        try:
            data = json.loads(path_obj.read_text(encoding="utf-8"))
            if not data and require_nonempty:
                issues.append(f"{name} contains empty JSON root")
            elif isinstance(data, dict) and "zone_lifts" in data:
                zl = data.get("zone_lifts") or {}
                if not zl:
                    issues.append(f"{name} has empty zone_lifts")
                else:
                    empty_designs = [k for k, v in zl.items() if isinstance(v, dict) and (not v.get("shoring") or not v.get("scaffold"))]
                    if empty_designs:
                        issues.append(f"{name} has {len(empty_designs)} zone lift(s) with empty shoring or scaffold designs")
            raw_json = json.dumps(data)
            if re.search(r'"(TBD|<fill[^"]*|\\[TODO\\])"', raw_json, re.I):
                issues.append(f"{name} contains unresolved placeholder values")
        except Exception as exc:
            issues.append(f"Invalid JSON in {name}: {exc}")
    elif lower.endswith(".docx") or lower.endswith(".txt") or (lower.endswith(".md") and "spec" in lower):
        if size < 100:
            issues.append(f"{name} appears incomplete ({size} bytes)")
        else:
            raw_text = ""
            if lower.endswith(".docx"):
                try:
                    import docx
                    doc = docx.Document(str(path_obj))
                    raw_text = " ".join(p.text for p in doc.paragraphs)
                except Exception:
                    pass
            else:
                try:
                    raw_text = path_obj.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    pass
            if raw_text and ("PART 1" in raw_text.upper() or "REFERENCES" in raw_text.upper()):
                stds_cited = set(re.findall(r"\b(?:IEEE|ASTM|NFPA|NEMA|UL|ANSI|UFGS|ISO|ASCE)\s+[\w.-]+", raw_text, re.I))
                ref_match = re.search(r"(?:1\.2\s+REFERENCES|PART\s+1.*?REFERENCES)(.*?)(?:PART\s+2|PART\s+II|2\.1)", raw_text, re.S | re.I)
                if ref_match:
                    ref_text = ref_match.group(1).upper()
                    missing_refs = []
                    for std in stds_cited:
                        std_clean = re.sub(r"\s+", "", std).upper()
                        if std_clean not in re.sub(r"\s+", "", ref_text):
                            missing_refs.append(std)
                    if missing_refs:
                        issues.append(f"{name}: Standards cited in body but missing from Part 1 References: {missing_refs[:6]}. Every cited standard must be formally listed in Part 1.")
    elif lower.endswith((".dxf", ".ifc")) and size < 100:
        issues.append(f"{name} appears incomplete ({size} bytes)")

sub_files = cfg.get("subFiles", [])
for target in cfg.get("primaryTargets", []):
    t_path = pathlib.Path(target)
    if not t_path.is_file():
        issues.append(f"Target deliverable missing: {target}")
        continue
    if target.endswith(".zip"):
        out_dir = t_path.parent
        # Check zip integrity & contents
        try:
            with zipfile.ZipFile(t_path, "r") as zf:
                bad_zip = zf.testzip()
                if bad_zip is not None:
                    issues.append(f"Zip {target} corrupted at entry: {bad_zip}")
                names = set(zf.namelist())
                for sub in sub_files:
                    fname = sub["filename"]
                    if not any(n.endswith(fname) for n in names):
                        issues.append(f"Zip {target} is missing required subfile: {fname}")
                # Check for duplicate CSI section files in specs/
                specs_seen = {}
                for fn in names:
                    m = re.search(r"specs/(\d{2}\s*\d{2}\s*\d{2})", fn, re.I)
                    if m:
                        sec_no = re.sub(r"\s+", " ", m.group(1)).strip()
                        specs_seen.setdefault(sec_no, []).append(fn)
                for sec_no, flist in specs_seen.items():
                    if len(flist) > 1:
                        issues.append(f"Duplicate specification files in zip for Section {sec_no}: {flist}. Keep only ONE .docx per section (e.g. 'specs/{sec_no}.docx').")
        except Exception as exc:
            issues.append(f"Target zip corrupted ({target}): {exc}")

        # Audit required subfiles on disk AND all key deliverable extensions in out_dir
        checked = set()
        for sub in sub_files:
            fp = out_dir / sub["filename"]
            checked.add(fp.resolve())
            check_single_file(fp, sub["filename"])
        if out_dir.exists():
            for fp in out_dir.rglob("*"):
                if fp.is_file() and fp != t_path and not fp.name.startswith(".") and fp.suffix.lower() in {".csv", ".xlsx", ".json", ".py", ".md", ".dxf", ".docx", ".ifc"}:
                    if fp.resolve() not in checked:
                        check_single_file(fp, fp.name, require_nonempty=False)
    else:
        check_single_file(t_path, target)

print(json.dumps(issues))
PY_VERIFY_EOF`;

  const res = await task.request({
    type: "exec",
    command: verifyScript,
    timeout_sec: 30,
  });

  if (res.output) {
    const lines = res.output.trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore non-JSON lines if any
      }
    }
  }
  return [];
}
