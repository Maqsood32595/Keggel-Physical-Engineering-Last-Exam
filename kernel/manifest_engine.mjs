// Copyright 2026 Google LLC / Fractal Kernel
//
// manifest_engine.mjs: Implements Manifest-Driven Feature Slicing for Agent Workspaces.
// Follows the Fractal Kernel rule:
// "Every capability is a Feature with a feature.manifest.json. One task = one feature slice."

export class ManifestEngine {
  constructor(task, workdir) {
    this.task = task;
    this.workdir = workdir || "/app";
    this.slicesPath = `${this.workdir}/.fractal/slices`;
    this.slices = [];
    this.activeSliceIndex = 0;
  }

  /**
   * Initializes the default engineering slices for a task.
   */
  async initializeSlices(taskAnalysis) {
    const defaultSlices = [
      {
        id: "slice_01_recon",
        name: "Recon & Constraints Extraction",
        description: "Explore workspace documents, specs, code, and identify all hard-gate constraints.",
        phase: "recon",
        allowedTools: ["bash", "read_file", "mcp"],
        expectedExports: ["recon_summary.md"],
      },
      {
        id: "slice_02_execution",
        name: "Engineering Computation & Deliverables",
        description: "Perform physical/structural/electrical calculations and generate required deliverable files.",
        phase: "compute",
        allowedTools: ["bash", "read_file", "write_file", "edit_file", "mcp"],
        expectedExports: taskAnalysis.subFiles.map(s => s.filename),
      },
      {
        id: "slice_03_packaging_and_audit",
        name: "Packaging & Hard-Gate Verification",
        description: "Package final deliverables (e.g. submission.zip), verify code compliance, and confirm non-empty outputs.",
        phase: "audit",
        allowedTools: ["bash", "read_file", "write_file"],
        expectedExports: taskAnalysis.primaryTargets,
      },
    ];

    this.slices = defaultSlices;

    // Write manifests to disk in the task container
    for (const slice of this.slices) {
      const manifestPath = `${this.slicesPath}/${slice.id}/feature.manifest.json`;
      const manifestContent = JSON.stringify(slice, null, 2);
      await this.task.request({
        type: "write_file",
        path: manifestPath,
        content_b64: Buffer.from(manifestContent).toString("base64"),
      });
    }

    this.task.send({
      type: "log",
      text: `[FractalKernel] Scaffolding ${this.slices.length} manifest-driven feature slices in ${this.slicesPath}`,
    });
  }

  getActiveSlice() {
    return this.slices[this.activeSliceIndex];
  }

  advanceSlice() {
    if (this.activeSliceIndex < this.slices.length - 1) {
      this.activeSliceIndex++;
      return true;
    }
    return false;
  }

  /**
   * Generates a scoped prompt for the active feature slice.
   * This limits prompt tokens and prevents cross-feature drift.
   */
  formatSlicePrompt(baseInstruction) {
    const slice = this.getActiveSlice();
    return `[FRACTAL KERNEL ACTIVE SLICE: ${slice.name} (${slice.id})]
Objective: ${slice.description}
Phase: ${slice.phase}
Target Deliverables for this Slice: ${slice.expectedExports.join(", ")}

Focus exclusively on completing the objectives of this slice without modifying unrelated features.
Ensure all outputs strictly conform to the engineering safety and dimensional criteria in the corpus.

Full Task Specifications:
${baseInstruction}`;
  }
}

