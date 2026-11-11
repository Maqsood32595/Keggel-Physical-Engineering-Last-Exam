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
    elif lower.endswith((".dxf", ".docx", ".ifc")) and size < 100:
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
