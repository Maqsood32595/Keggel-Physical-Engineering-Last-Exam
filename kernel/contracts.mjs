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
      // Create output dir and minimal placeholder subfiles
      let script = `mkdir -p "${outputDir}" && cd "${outputDir}"\n`;
      for (const item of subFiles) {
        if (item.filename.endsWith(".csv")) {
          // If columns are mentioned, create a header row
          const colsMatch = item.requirements.match(/`([^`]+)`/g);
          const headers = colsMatch ? colsMatch.map(c => c.replace(/`/g, "")).join(",") : "id,name,value";
          script += `cat << 'EOF' > "${item.filename}"\n${headers}\nEOF\n`;
        } else if (item.filename.endsWith(".json")) {
          script += `cat << 'EOF' > "${item.filename}"\n{}\nEOF\n`;
        } else if (item.filename.endsWith(".md")) {
          script += `cat << 'EOF' > "${item.filename}"\n# Method Note\n\nInitial draft.\nEOF\n`;
        } else {
          script += `touch "${item.filename}"\n`;
        }
      }
      // Zip them into submission.zip
      if (subFiles.length > 0) {
        script += `zip -q "${target}" ${subFiles.map(s => `"${s.filename}"`).join(" ")} || true\n`;
      } else {
        script += `echo "placeholder" > placeholder.txt && zip -q "${target}" placeholder.txt || true\n`;
      }
      task.send({ type: "log", text: `[FractalKernel] Bootstrapping early deliverable skeleton: ${target}` });
      await task.request({ type: "exec", command: script, timeout_sec: 30 });
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
 * Hard-gate verification: inspects deliverables before submitting.
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
