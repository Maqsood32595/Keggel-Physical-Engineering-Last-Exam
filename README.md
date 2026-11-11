# Fractal Kernel Engineering Harness (PLE)

An autonomous agent harness implementing the **Fractal Kernel** manifest-driven feature architecture for **Physical-Engineering's Last Exam (PLE)** benchmark and Google Kaggle competition.

[![Fractal Kernel Architecture](https://img.shields.io/badge/Architecture-Fractal_Kernel-blue.svg)](https://github.com/Maqsood32595/fractal-kernel)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21622791.svg)](https://doi.org/10.5281/zenodo.21622791)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

---

## 1. Problem & Architectural Rationale

In long-horizon engineering tasks spanning 6 hours, traditional monolithic agent harnesses fail due to:
* **Context Degradation & Token Bloat**: Reading dozens of 2D/3D CAD drawings, geotechnical reports, and spec sheets causes prompt exhaustion and hallucination.
* **Cross-Discipline Regressions**: Modifying one component (e.g. beam sizing) inadvertently invalidates adjacent constraints (e.g. ductwork clearances).
* **Binary Hard Gates**: In physical engineering, a single missed deliverable or code violation yields a total score of 0.

### The Fractal Kernel Solution
Based on empirical research (`Zenodo DOI: 10.5281/zenodo.21622791`), Fractal Kernel enforces:
* **85.9% Reduction in Token Bloat**: Dynamically scopes the model's context window to isolated feature slices.
* **0.0% Cross-Slice Regressions**: Strict manifest-driven contracts prevent inter-slice interference.
* **Pre-Flight Safety Net & Hard-Gate Validation**: Bootstraps early valid deliverable skeletons immediately to prevent zero-score runs, with deterministic contract verification prior to completion.

---

## 2. System Architecture

```
fractal-engineering-harness/
├── kernel/
│   ├── contracts.mjs         # Hard-gate assertions, schema extractors, early skeleton bootstrapper
│   ├── manifest_engine.mjs   # Feature slice discovery and bounded context generation
│   └── mcp_client.mjs        # JSON-RPC Streamable HTTP MCP router
├── serve.mjs                 # WebSocket protocol, streaming agent loop & error recovery
├── submission.yaml           # Kaggle/PLE competition entry configuration
└── package.json              # Lightweight dependencies (ws, undici)
```

---

## 3. Operational Workflow

1. **Recon & Target Discovery**: Parses the incoming task instructions for target deliverables (`output/submission.zip`, `.ifc`, `.py`, `.csv`).
2. **Early Deliverable Bootstrapping**: Writes an initial valid baseline submission to disk immediately, guaranteeing that partial credit is locked in regardless of timeouts.
3. **Manifest Slicing**: Partitions the workspace into isolated feature directories (`.fractal/slices/*`) governed by `feature.manifest.json`.
4. **Dynamic Tool & MCP Routing**: Connects to task MCP servers via Streamable HTTP, exposing tools without polluting the global prompt.
5. **Contract Audit**: Before finalizing, executes schema and file verification against all required deliverables, prompting the agent for targeted fixes if any discrepancies remain.

---

## 4. Local Verification & Testing

```bash
# Verify harness readiness via PLE kit
uv run python -m kit check ../fractal-engineering-harness --env-file ../.env

# Run evaluation on the public dev set
uv run python eval/run.py ../fractal-engineering-harness --env-file ../.env
```
