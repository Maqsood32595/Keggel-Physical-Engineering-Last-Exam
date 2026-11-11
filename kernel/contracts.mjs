// Copyright 2026 Google LLC / Fractal Kernel
//
// contracts.mjs: Implements Fractal Kernel Contract Validation & Hard-Gate Verification
// for Physical-Engineering's Last Exam (PLE).

export function parseDeliverables(instruction, workdir = "/app") {
  const deliverables = new Set();
  
  // 1. Check for explicit output file paths in instructions
  const pathRegex = /(?:\/[\w.-]+)+\/(?:submission\.zip|solution\.py|model\.ifc|[\w.-]+\.(?:zip|py|ifc|csv|json|md|xlsx|docx))/gi;
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

  // 3. Extract sub-files required inside submission.zip (e.g. from markdown tables)
  const subFiles = [];
  const tableRowRegex = /\|\s*`?([\w.-]+\.(?:csv|json|md|py|txt|ifc|pdf))`?\s*\|\s*([^|\n]+)\|/gi;
  while ((match = tableRowRegex.exec(instruction)) !== null) {
    const filename = match[1].trim();
    const colsDesc = match[2].trim();
    if (!["File", "Name", "Parameter"].includes(filename)) {
      subFiles.push({ filename, requirements: colsDesc });
    }
  }

  return {
    primaryTargets: Array.from(deliverables),
    subFiles,
  };
}

/**
 * Creates an early valid skeleton of deliverables on disk within the first turns.
 * The benchmark strictly states:
 * "Create a complete submission early, then improve it in place. The last file on disk is graded."
 */
export async function createEarlySkeleton(task, { primaryTargets, subFiles }) {
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
          script += `test -f "${item.filename}" || cat << 'EOF' > "${item.filename}"\n# Method Note\n\nInitial placeholder draft.\nEOF\n`;
        } else {
          script += `test -f "${item.filename}" || touch "${item.filename}"\n`;
        }
      }
      task.send({ type: "log", text: `[FractalKernel] Bootstrapping early deliverable skeleton in ${outputDir}` });
      await task.request({ type: "exec", command: script, timeout_sec: 30 });
      await syncDeliverablesToZip(task, { primaryTargets: [target] });
    } else if (target.endsWith(".py")) {
      const script = `mkdir -p "$(dirname "${target}")" && test -f "${target}" || echo '# Solution script' > "${target}"`;
      await task.request({ type: "exec", command: script, timeout_sec: 15 });
    } else if (target.endsWith(".ifc")) {
      const script = `mkdir -p "$(dirname "${target}")" && test -f "${target}" || touch "${target}"`;
      await task.request({ type: "exec", command: script, timeout_sec: 15 });
    }
  }
}

/**
 * Synchronizes generated files from their output directory into target zip files.
 */
export async function syncDeliverablesToZip(task, { primaryTargets }) {
  for (const target of primaryTargets) {
    if (!target.endsWith(".zip")) continue;
    const outputDir = target.substring(0, target.lastIndexOf("/"));
    const syncScript = `python3 -I -c "
import pathlib, zipfile, sys
out_dir = pathlib.Path('${outputDir}')
zip_path = pathlib.Path('${target}')
if not out_dir.exists():
    sys.exit(0)
files = [f for f in out_dir.rglob('*') if f.is_file() and f != zip_path and not f.name.startswith('.') and f.suffix != '.zip']
if files:
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f.relative_to(out_dir))
    print(f'Synchronized {len(files)} files to {zip_path}')
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
export async function verifyDeliverables(task, { primaryTargets, subFiles }) {
  const issues = [];
  
  for (const target of primaryTargets) {
    const check = await task.request({
      type: "exec",
      command: `test -f "${target}" && ls -lh "${target}" || echo "MISSING"`,
      timeout_sec: 15,
    });
    if (!check.output || check.output.includes("MISSING")) {
      issues.push(`Target deliverable missing: ${target}`);
      continue;
    }

    if (target.endsWith(".zip")) {
      const outputDir = target.substring(0, target.lastIndexOf("/"));
      
      // Check each subfile directly on disk
      for (const sub of subFiles) {
        const filePath = `${outputDir}/${sub.filename}`;
        if (sub.filename.endsWith(".csv")) {
          const linesCheck = await task.request({
            type: "exec",
            command: `test -f "${filePath}" && wc -l < "${filePath}" || echo "0"`,
            timeout_sec: 10,
          });
          const lineCount = parseInt(linesCheck.output?.trim() || "0", 10);
          if (lineCount <= 1) {
            issues.push(`${sub.filename} on disk has only header row or is empty (line count: ${lineCount})`);
          }
        } else if (sub.filename.endsWith(".md")) {
          const wordsCheck = await task.request({
            type: "exec",
            command: `test -f "${filePath}" && wc -w < "${filePath}" || echo "0"`,
            timeout_sec: 10,
          });
          const wordCount = parseInt(wordsCheck.output?.trim() || "0", 10);
          if (wordCount < 200) {
            issues.push(`${sub.filename} on disk has ${wordCount} words (minimum required is 200 words)`);
          }
        } else if (sub.filename.endsWith(".json")) {
          const jsonCheck = await task.request({
            type: "exec",
            command: `python3 -I -c "import json; d=json.load(open('${filePath}')); print('KEYS:', len(d.get('zone_lifts', d)))" 2>/dev/null || echo "ERR"`,
            timeout_sec: 10,
          });
          if (!jsonCheck.output || jsonCheck.output.includes("ERR") || jsonCheck.output.includes("KEYS: 0")) {
            issues.push(`${sub.filename} on disk has empty or invalid JSON structure`);
          }
        }
      }

      // Check zip integrity and presence of subfiles
      const zipCheck = await task.request({
        type: "exec",
        command: `unzip -l "${target}"`,
        timeout_sec: 20,
      });
      if (zipCheck.exit_code !== 0) {
        issues.push(`Target zip corrupted: ${target}`);
      } else {
        for (const sub of subFiles) {
          if (!zipCheck.output.includes(sub.filename)) {
            issues.push(`Zip ${target} is missing required subfile: ${sub.filename}`);
          }
        }
      }
    }
  }
  return issues;
}
