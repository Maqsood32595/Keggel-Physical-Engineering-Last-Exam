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
        description: "Inventory all workspace documents, CAD/DXF/IFC geometry, scanned PDFs, catalogs, and regulatory correspondence; apply authority precedence and decompose compound sub-clauses ((a)/(b)/(i)/(ii))—including qualitative coverage/completeness gates—into atomic rows in active constraint registers without superseded noise.",
        phase: "recon",
        allowedTools: ["bash", "read_file", "mcp"],
        expectedExports: ["recon_summary.md"],
      },
      {
        id: "slice_02_execution",
        name: "Engineering Computation & Deliverables",
        description: "Build deterministic 64-bit computational scripts to solve governing physical, analytical, geometric, and cost/scheduling requirements; enforce joint discrete sizing (capacity AND geometric gap/fit/clearance together), cumulative programme caps, per-stage topology/equipment rating checks, resource leveling, zero geometric clashes, schema/column alignment, and full catalog/BOM population.",
        phase: "compute",
        allowedTools: ["bash", "read_file", "write_file", "edit_file", "mcp"],
        expectedExports: taskAnalysis.subFiles.map(s => s.filename),
      },
      {
        id: "slice_03_packaging_and_audit",
        name: "Packaging & Hard-Gate Verification",
        description: "Recompute serialized ledger totals/costs, verify global argmin binding margins across all constraints, check register schema/column alignment and zero placeholder values (TBD/NaN), and package exact requested deliverables.",
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

