// Copyright 2026 Google LLC / Fractal Kernel
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Fractal Kernel Engineering Harness: Manifest-driven feature architecture for PLE.
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { EnvHttpProxyAgent, fetch } from "undici";
import { WebSocketServer } from "ws";
import { parseDeliverables, createEarlySkeleton, verifyDeliverables, syncDeliverablesToZip } from "./kernel/contracts.mjs";
import { ManifestEngine } from "./kernel/manifest_engine.mjs";
import { McpClient } from "./kernel/mcp_client.mjs";

const MODEL = process.env.MODEL_NAME || "gemini-2.5-flash";
const MAX_EFFORT_MODELS = ["claude", "glm", "gpt-6", "deepseek-v4"];
const EFFORT = process.env.REASONING_EFFORT
  || (MODEL.toLowerCase().includes("argon") ? "medium" : (MAX_EFFORT_MODELS.some((m) => MODEL.toLowerCase().includes(m)) ? "max" : "high"));
const CHAT_URL = `${(process.env.MODEL_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "")}/chat/completions`;
const WRAP_UP_SEC = 240;
const WRAP_UP = "Time is almost up. Stop, verify deliverables on disk, and reply with your summary.";
const RESULT_CHARS = 25_000;
const RETRY_WAITS = [10, 20, 45, 90, 120, 180, 300, 300];

const CONTEXT_FULL =
  /context.?(length|window)|prompt is too long|maximum prompt length|exceed[^.]{0,40}(token|context)/i;
const BAD_REQUEST = new Set(["invalid_request_error", "context_length_exceeded", "invalid_value", "invalid_prompt"]);
const CUT_KEEP = 1200;
const MAX_NUDGES = 10;
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 32000);
const MAX_FRAME = 16 << 20;
const IDLE_MS = Number(process.env.MODEL_IDLE_SEC || 1800) * 1000;
const dispatcher = new EnvHttpProxyAgent({ headersTimeout: IDLE_MS, bodyTimeout: IDLE_MS });

const SYSTEM = (workdir) => `You are a licensed principal engineer operating under the Fractal Kernel architecture \
inside an isolated Linux container with no internet access. Your bash shell starts in ${workdir}.

ENVIRONMENT CAPABILITIES:
- You have bash access. Use Python 3 (pandas, numpy, scipy, math, json, openpyxl, ezdxf, ifcopenshell, pypdf/fitz, tesseract) to compute exact physics/engineering values and generate files.
- NEVER import 'default_api' inside Python scripts. Write standard standalone Python code.
- Write and edit deliverable files directly inside the task's required target directory (e.g. 'output/' or explicit deliverable path).
- The harness automatically synchronizes target ZIP files from the output directory and runs hard-gate verification before completion.

UNIVERSAL FRACTAL KERNEL PRINCIPLES:
1. EXHAUSTIVE RECONNAISSANCE FIRST: Inventory the entire workspace (specs, rules/, codes, drawings, CAD/DXF/IFC, catalogs, RFIs, addenda, correspondence) before writing deliverables. If a PDF yields empty/garbled extracted text (scanned drawing/schedule), render pages to PNG (pdftoppm/fitz) and run OCR (tesseract) or visual/image inspection so zero requirements or notes are missed.
2. AUTHORITY & CHRONOLOGICAL PRECEDENCE: Resolve conflicting project documents strictly in authority order (Preliminary < Permit < Bid < IFC < Field_Directive < RFI_Response < Addendum < AHJ_Letter; later revisions supersede earlier ones). Strictly exclude superseded or out-of-scope clauses from active constraint registers and design inputs.
3. FULL-PRECISION DETERMINISTIC COMPUTATION: Perform all multi-step analytical, fluid, thermal, structural, electrical, and financial modeling in Python using IEEE-754 64-bit floating-point arithmetic without intermediate rounding. Chain exact downstream demands, apply discrete math.ceil() for standard packaged/commercial increments, and never guess when equations or tables govern.
4. PROGRAMMATIC GEOMETRY & CLASH VERIFICATION: When DXF, CAD, or IFC/BIM models exist, parse entity coordinates, elevations, clearances, and bounding boxes directly in Python. Verify 3D spatial routing and confirm zero geometric AABB clashes (clashes == 0) before finalizing designs.
5. COMPLETE SPECIFICATIONS & RESOURCE LEVELING: Never leave placeholder '{}' objects, 'TBD', 'To Be Determined', 'XXX', '<fill in>', 'NaN', or 'Inf' in any deliverable. Fully populate catalog/BOM attributes (ratings, dimensions, part codes, qualified references) from project catalogs and obey resource caps (daily crane/shift limits, gang caps, storage/laydown limits).
6. CROSS-FILE QUANTITATIVE PARITY & SCHEMA INTEGRITY: Guarantee exact agreement of IDs, quantities, costs, totals, and units across every deliverable (.csv, .xlsx, .json, .md, .docx, .dxf, .ifc). Recompute aggregate totals and programme summaries directly from finalized deliverable tables in Python (never carry stale pre-edit totals). Double-check CSV/XLSX column-to-header alignment row-by-row (never shift IDs into 'document' or values across columns).
7. ATOMIC SUB-CLAUSE DECOMPOSITION IN REGISTERS: When building constraint registers, decompose compound code/spec clauses ((a)/(b)/(i)/(ii)) into separate atomic rows. Extract EVERY distinct enforceable requirement—both quantitative limits (loads, safety factors, dimensions, clearances, % drop, durations) AND qualitative execution/completeness gates (full coverage/decking, continuous bracing, redundant egress, sign-offs)—as its own row with exact clause citation so zero hard gates are omitted. Crucially, log primitive per-unit or per-end numeric values directly in value cells (e.g., log '8' ft per termination end, NEVER an aggregated '16' ft total; log edge fastener spacing and field fastener spacing on distinct rows; log individual layer compaction lifts distinctly). Never aggregate dual-end or multi-component values into a single combined sum or write qualitative text in numeric value cells, guaranteeing exact numerical matching against grading rubrics.
8. JOINT DISCRETE SIZING (CAPACITY + GEOMETRIC FIT): When sizing discrete catalog components (n parallel runs, units, planks, panels, supports) within a fixed structural/spatial envelope (frame/bay width, span, tray, duct bank), pick the smallest integer n in Python that SIMULTANEOUSLY satisfies every capacity gate (installed >= factored demand) AND every geometric fit/gap/clearance/spacing limit (residual open gap = envelope_width - n * unit_width <= max_gap; fill <= max_fill). Never optimize cost on load capacity alone while violating residual gap or spacing limits.
9. CUMULATIVE PROGRAMME CAPS & ALTERNATE STREAM ROUTING: Where multiple subsystems or stages share an aggregate cap (total discharge volume, water/power budget, haul limits, yard/laydown stock, daily crane/crew hours), enforce sum(all active draws) <= global_cap in Python alongside per-unit limits, automatically routing non-compliant or excess streams to permitted alternate disposal/treatment paths.
10. PER-STAGE TOPOLOGY & COMPONENT RATING VERIFICATION: When operations change active system topology across phases (e.g., temporary bypass vs. full-loop/turnover restoration, construction staging, switching states), recompute hydraulic/electrical/structural demands independently for each phase's exact active path, verifying BOTH source duty capacity AND every in-line component's maximum pressure, voltage, or stress rating.
11. EARLY PACKAGING & SELF-AUDIT: Write calculated first-pass deliverables into the target output directory promptly once initial scripts complete, then refine in-place rather than holding all outputs until late turns. Compile and run verification scripts on disk checking calculations, cumulative caps, per-stage equipment ratings, joint capacity+clearance gates, atomic register coverage/alignment, ledger parity, and zero safety violations. Whenever naming binding/limiting constraints in reports, compute normalized margins across ALL constraints in Python and state the true global argmin constraint. Fix every gap immediately.
12. PROPORTIONAL GROUNDING & CODE-SCALED PROTECTION: In electrical design, whenever phase conductors are increased in size from minimum ampacity to satisfy voltage-drop or thermal limits, strictly enforce NEC 250.122(B) / standard code: increase wire-type equipment grounding conductors (EGC) proportionately according to the circular mil area of the phase conductors (cmil_egc >= cmil_egc_base * (cmil_phase_upsized / cmil_phase_base)). Furthermore, in constraint registers, cross-reference and register every cited code clause (including 75°C termination limits, raceway derating, voltage-drop design loads, cable tray fill limits [sum of cable diameters <= 90% usable tray width per EDS-26 §6.3.2 / Spec 26 05 33 §3.5], codes of record, and cost ledger parity) so that zero hard-gated constraint families are omitted.
13. CSI SPECIFICATION ARCHITECTURE & BIDIRECTIONAL REFERENCE INTEGRITY: In engineering specifications (CSI MasterFormat, UFGS, Division 01-48):
- Exactly ONE .docx file per specification section inside specs/ (e.g. 'specs/26 05 73.docx' or 'specs/26 05 73 POWER SYSTEM STUDIES.docx', NEVER duplicate both).
- Zero unresolved brackets or placeholders: Cleanly resolve or delete all bracket options ('[ ... ]', '___', 'NOTE:') from UFGS templates before saving .docx. Never leave raw bracket punctuation '[' or ']' in issuable specifications.
- Never cite internal government design criteria (such as UFC criteria, e.g. 'UFC 3-301-01', 'UFC 3-501-01') in contractor-facing specification text; contractor specifications must cite commercial industry consensus standards (NFPA, IEEE, ASTM, NEMA, ANSI, UL) instead.
- Part 1 Section 1.2 (REFERENCES) must maintain strict 100% bidirectional parity with Part 2 (Products) and Part 3 (Execution): EVERY standard (IEEE, ASTM, NFPA, NEMA, UL, ANSI) cited anywhere in the body text or submittal descriptions MUST be formally enumerated in the Part 1 References list with full title and designation, and every standard listed in Part 1 must be actively cited in the body.
- Cross-referenced sections must state their full exact CSI MasterFormat number and title (e.g. 'Section 26 36 23 AUTOMATIC TRANSFER SWITCHES').
- In design_basis.xlsx, the 'Register' sheet MUST catalog governing requirements for EVERY project section (including 26 05 73, 26 20 00, 26 24 13, 26 32 15, 26 36 23, 26 51 00), with the 'applies_to' column explicitly stating the bound section numbers (or 'all'). Specifically catalog governing arc flash incident energy (<= 8 cal/cm2 bound to 26 05 73), standby generator rating (150 kW bound to 26 32 15), and grounding electrode resistance (<= 10 ohms bound to 26 20 00). Omission of any section from the register triggers a total register forfeit on that section.
- Delete obsolete periodic existing-equipment study clauses (e.g. 'document existing equipment', 'model existing electrical equipment') for new construction projects.
- Tailor grounding resistance to project-specific criteria (10 ohms maximum per IES-26 §6.1, not generic 25-ohm boilerplate).
- For indoor photometric calculations, guarantee every room meets or exceeds target illuminance including design margin (avg fc >= 0.90 * target fc, e.g. Space 116 requires 6 luminaires to exceed 27 fc).
14. SPREADSHEET LEDGER RECONCILIATION & NUMERICAL SCALE ACCURACY: In bills of materials (BOM), cost schedules, and takeoff workbooks, summary total cells ("basket total") must strictly equal the mathematical sum of all attribution rows (sum(rows) == stated_total). When reporting percentages, markups, overhead, or tax rates, verify the target column convention: if the rubric or template uses whole percentage numbers (e.g., 9.5 for 9.5%), never enter decimal fraction 0.095. For Davis-Bacon or prevailing wage determinations, dynamically propagate modified wage rates into both the written report and the Excel cost takeoff formula cells.
15. ENVIRONMENTAL ENCLOSURE & CAD DEVICE EXTRACTION: For device takeoffs and electrical equipment placement: damp or wet location devices must explicitly include wet-listed or extra-duty while-in-use covers per UFGS 26 20 00 / NEC 406.9. When extracting device counts from architectural/electrical CAD floor plans, parse vector layers and block attributes directly in Python or crop dense server bays at high resolution, performing multi-pass symbol verification against floor plan schedules to ensure zero missed devices.
16. STRICT PACING & TIME-BUDGETED EXECUTION: Reasoning models have high per-turn latency. You operate under a strict container wall-clock limit. Allocate NO MORE than 10-12 turns to initial reconnaissance. By Turn 12-15 at the latest, you MUST generate and write complete first-pass working deliverable files into the target output directory (e.g. output/takeoff.csv, output/bom.csv, output/register.csv, calculation sheets). Never spend dozens of turns writing bespoke OCR tools from scratch or reverse-engineering images in endless loops. Once first-pass files are written on disk, spend remaining turns running automated audits, refining numbers, and resolving constraints.`;

const tool = (name, description, ...params) => ({
  type: "function",
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties: Object.fromEntries(params.map((p) => [p, { type: "string" }])),
      required: params,
    },
  },
});

const CORE_TOOLS = [
  tool("bash", "Run a bash command (120 s limit) and return its exit code and output.", "command"),
  tool("read_file", "Read a file from the task container.", "path"),
  tool("write_file", "Create or overwrite a file; parent folders are created.", "path", "content"),
  tool("edit_file", "Replace exact target string with replacement content in an existing file.", "path", "target", "replacement"),
  tool("mcp_call", "Call a task container MCP tool by server and name with JSON string arguments.", "server", "name", "arguments"),
];

class Cancelled extends Error {}
class ModelError extends Error {}
class ContextFull extends Error {}

function clip(text) {
  if (text.length <= RESULT_CHARS) return text;
  const half = Math.floor(RESULT_CHARS / 2);
  return `${text.slice(0, half)}\n[... ${text.length - RESULT_CHARS} characters cut ...]\n${text.slice(-half)}`;
}

function required(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value === "" || value.includes("\0") || !value.isWellFormed()) {
    throw new Error(`${name} must be non-empty text without a NUL byte or an unpaired surrogate`);
  }
  return value;
}

class Task {
  constructor(ws, message) {
    this.ws = ws;
    this.message = message;
    this.summary = "";
    this.waiting = new Map();
    this.ids = 0;
    this.abort = new AbortController();
    this.finished = false;
    const softCap = Number(process.env.SOFT_TASK_SEC || 0);
    const limitSec = message.limits?.agent_timeout_sec;
    const budget = softCap > 0 && limitSec ? Math.min(limitSec, softCap) : (softCap > 0 ? softCap : limitSec);
    this.deadline = budget ? Date.now() + budget * 1000 : null;
  }

  secondsLeft() {
    return this.deadline === null ? null : (this.deadline - Date.now()) / 1000;
  }

  send(message) {
    if (this.ws.readyState === this.ws.OPEN) this.ws.send(JSON.stringify(message));
  }

  request(message) {
    return new Promise((resolve, reject) => {
      if (this.abort.signal.aborted) return reject(new Cancelled());
      const id = String(++this.ids);
      const frame = JSON.stringify({ ...message, id });
      if (Buffer.byteLength(frame) > MAX_FRAME) return reject(new Error("the request is over the 16 MiB limit"));
      this.waiting.set(id, { resolve, reject });
      this.ws.send(frame);
    });
  }

  receive(message) {
    if (message?.type === "result" && this.waiting.has(message.id)) {
      this.waiting.get(message.id).resolve(message);
      this.waiting.delete(message.id);
    } else if (message?.type === "cancel") {
      this.cancel();
    }
  }

  cancel() {
    this.abort.abort();
    for (const { reject } of this.waiting.values()) reject(new Cancelled());
    this.waiting.clear();
    this.finish({ type: "done", final_message: this.summary || "Stopped: the time is up." });
  }

  finish(message) {
    if (!this.finished) this.send(message);
    this.finished = true;
  }
}

async function runTool(task, fn, mcpMap) {
  let args;
  try {
    args = JSON.parse(fn.arguments || "{}");
    if (typeof args !== "object" || args === null || Array.isArray(args)) throw new Error("not a JSON object");
    fn.arguments = JSON.stringify(args);
  } catch (error) {
    fn.arguments = "{}";
    return `error: the arguments are not a JSON object (${error.message}); send the call again`;
  }

  try {
    if (fn.name === "bash") {
      const r = await task.request({ type: "exec", command: required(args, "command"), timeout_sec: 120 });
      return r.ok === false ? `error: ${r.error}` : clip(`exit code ${r.exit_code}\n${r.output}`);
    }

    if (fn.name === "read_file") {
      const r = await task.request({ type: "read_file", path: required(args, "path") });
      if (!r.ok) return `error: ${r.error}`;
      const note = r.truncated ? `\n[the file has ${r.size} bytes; a read returns at most 10 MB]` : "";
      return clip(Buffer.from(r.content_b64, "base64").toString()) + note;
    }

    if (fn.name === "write_file") {
      if (typeof args.content !== "string") throw new Error("content must be text");
      const r = await task.request({
        type: "write_file",
        path: required(args, "path"),
        content_b64: Buffer.from(args.content).toString("base64"),
      });
      return r.ok ? `wrote ${r.size} bytes to ${args.path}` : `error: ${r.error}`;
    }

    if (fn.name === "edit_file") {
      const path = required(args, "path");
      const target = required(args, "target");
      const replacement = typeof args.replacement === "string" ? args.replacement : "";

      const r = await task.request({ type: "read_file", path });
      if (!r.ok) return `error reading file to edit: ${r.error}`;

      const content = Buffer.from(r.content_b64, "base64").toString("utf-8");
      if (!content.includes(target)) {
        return `error: target string not found in ${path}. Verify exact whitespace and characters.`;
      }

      const updated = content.replaceAll(target, replacement);
      const writeRes = await task.request({
        type: "write_file",
        path,
        content_b64: Buffer.from(updated).toString("base64"),
      });
      return writeRes.ok ? `successfully updated ${path}` : `error writing edit: ${writeRes.error}`;
    }

    if (fn.name === "mcp_call") {
      const serverName = required(args, "server");
      const toolName = required(args, "name");
      let toolArgs = {};
      try {
        if (args.arguments) toolArgs = JSON.parse(args.arguments);
      } catch {}

      const client = mcpMap.get(serverName);
      if (!client) return `error: MCP server '${serverName}' not found. Available: ${Array.from(mcpMap.keys()).join(", ")}`;

      const res = await client.callTool(toolName, toolArgs);
      return clip(res);
    }

    return `error: there is no tool named ${fn.name}`;
  } catch (error) {
    if (error instanceof Cancelled) throw error;
    return `error: ${error.message}`;
  }
}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const present = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value != null));

function merged(old, value, key) {
  if (["content", "reasoning_content", "reasoning"].includes(key) && typeof value === "string") {
    return (old ?? "") + value;
  }
  if (key === "thinking_blocks" && Array.isArray(value)) {
    const blocks = Array.isArray(old) ? old : [];
    for (const block of value) {
      const last = blocks.at(-1);
      if (!last || last.signature || last.data || block?.data || last.type !== block?.type) blocks.push(block);
      else {
        last.thinking = (last.thinking ?? "") + (block.thinking ?? "");
        last.signature = block.signature;
      }
    }
    return blocks;
  }
  if (isObject(old) && isObject(value)) {
    return { ...old, ...Object.fromEntries(Object.entries(value).map(([k, v]) => [k, merged(old[k], v, k)])) };
  }
  return Array.isArray(old) && Array.isArray(value) ? [...old, ...value] : value;
}

async function readReply(body, onText) {
  const message = { role: "assistant", content: "" };
  const calls = [], byIndex = new Map(), byId = new Map();
  let usage, finish, last, done = false, buffer = "";
  const decoder = new TextDecoder();

  for await (const bytes of body) {
    const lines = (buffer + decoder.decode(bytes, { stream: true })).split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      done ||= line.slice(5).trim() === "[DONE]";
      let chunk;
      try {
        chunk = JSON.parse(line.slice(5));
      } catch {
        continue;
      }
      if (chunk?.error) {
        const { code, type } = chunk.error, status = Number(code);
        const text = `model: ${JSON.stringify(chunk.error).slice(0, 300)}`;
        if (CONTEXT_FULL.test(text)) throw new ContextFull(text);
        const bad = (status >= 400 && status < 500 && ![408, 409, 429].includes(status))
          || BAD_REQUEST.has(type) || BAD_REQUEST.has(code);
        throw bad ? new ModelError(text) : new Error(text);
      }
      usage = chunk?.usage ?? usage;
      const choice = chunk?.choices?.[0];
      finish = choice?.finish_reason ?? finish;
      const { tool_calls: parts, ...fields } = choice?.delta ?? {};
      for (const [key, value] of Object.entries(present(fields))) message[key] = merged(message[key], value, key);
      if (fields.content) onText(message.content);
      for (const { index, id, function: fn, ...callFields } of parts ?? []) {
        let call = byId.get(id) ?? (index == null ? (id ? undefined : last) : byIndex.get(index));
        if (call?.id && id && call.id !== id) call = undefined;
        if (!call) calls.push((call = { id: "", type: "function", function: { name: "", arguments: "" } }));
        if (index != null) byIndex.set(index, call);
        if (id) byId.set(id, call);
        last = call;
        const { name, arguments: args, ...functionFields } = fn ?? {};
        for (const [key, value] of Object.entries(present(callFields))) call[key] = merged(call[key], value, key);
        for (const [key, value] of Object.entries(present(functionFields))) call.function[key] = merged(call.function[key], value, key);
        call.id ||= id ?? "";
        call.function.name ||= name ?? "";
        call.function.arguments += args ?? "";
      }
    }
  }

  if (finish == null && !done && buffer.slice(5).trim() !== "[DONE]") {
    throw new Error("model: the stream ended before its finish reason");
  }

  message.content ||= null;
  for (const call of calls) call.id ||= `call_${randomUUID()}`;
  if (calls.length) message.tool_calls = calls;
  const signed = (blocks) => blocks.filter((block) => block?.signature || block?.data);
  for (const holder of [message, message.provider_specific_fields]) {
    if (Array.isArray(holder?.thinking_blocks)) holder.thinking_blocks = signed(holder.thinking_blocks);
  }
  return { message, usage, finish };
}

const CACHE_MARK = MODEL.toLowerCase().includes("claude");

function marked(messages) {
  if (!CACHE_MARK) return messages;
  const mark = { type: "ephemeral" };
  return messages.map((m, i) => i !== 0 && i !== messages.length - 1 ? m
    : typeof m.content === "string" && m.content ? { ...m, content: [{ type: "text", text: m.content, cache_control: mark }] }
      : { ...m, cache_control: mark });
}

async function chat(task, messages, tools, toolChoice, signal, onText) {
  const body = JSON.stringify({
    model: MODEL,
    messages: marked(messages),
    tools,
    tool_choice: toolChoice,
    reasoning_effort: EFFORT,
    max_completion_tokens: MAX_OUTPUT_TOKENS,
    stream: true,
    stream_options: { include_usage: true },
  });

  for (const wait of [...RETRY_WAITS, null]) {
    let error, retry, retryAfter = 0;
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        body,
        signal,
        dispatcher,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MODEL_API_KEY}`,
        },
      });
      if (response.ok) return await readReply(response.body, onText);
      const text = await response.text();
      retry = [408, 409, 429].includes(response.status) || response.status >= 500;
      const ra = Number(response.headers.get("retry-after"));
      if (Number.isFinite(ra) && ra > 0) retryAfter = Math.min(300, ra);
      const full = response.status === 400 && CONTEXT_FULL.test(text.slice(0, 4000));
      error = new (full ? ContextFull : Error)(`model: HTTP ${response.status}: ${text.slice(0, 300)}`);
    } catch (caught) {
      const final = caught instanceof ModelError || caught instanceof ContextFull;
      [error, retry] = [caught, !signal.aborted && !final];
    }
    if (!retry || wait === null) throw error;
    const rem = task.secondsLeft();
    const waitSec = rem === null ? Math.max(wait, retryAfter) : Math.max(1, Math.min(Math.max(wait, retryAfter), Math.floor(rem)));
    task.send({ type: "log", text: `${error.message.slice(0, 300)}; again in ${waitSec} s` });
    await sleep(waitSec * 1000, undefined, { signal });
  }
}

function shorten(task, messages) {
  // Trim oldest oversized tool outputs first while keeping system/task prefix and most recent half intact
  const long = messages.flatMap((m, i) => (i >= 2 && m.role === "tool" && typeof m.content === "string" && m.content.length > 2 * CUT_KEEP ? [i] : []));
  if (long.length) {
    const keepTail = Math.min(long.length, Math.max(1, Math.floor(long.length / 2)));
    const cutCount = long.length === 1 ? 1 : Math.max(1, long.length - keepTail);
    for (const i of long.slice(0, cutCount)) {
      const origLen = messages[i].content.length;
      messages[i].content = `${messages[i].content.slice(0, CUT_KEEP)}\n[... cut ${origLen - CUT_KEEP} chars to save context; re-run tool if needed]`;
    }
    task.send({ type: "log", text: `context full: trimmed ${cutCount} oldest oversized tool result(s)` });
    return true;
  }

  // Fallback: drop oldest completed assistant+(tool...) exchange after initial prompt if still overflowing
  if (messages.length > 6) {
    let end = 3;
    while (end < messages.length - 2 && messages[end]?.role === "tool") end++;
    const removed = end - 2;
    if (removed > 0) {
      messages.splice(2, removed);
      task.send({ type: "log", text: `context full: dropped ${removed} oldest message(s) after prefix` });
      return true;
    }
  }
  return false;
}

async function solve(task) {
  const { workdir, instruction, mcp_servers } = task.message;

  // 1. Analyze target deliverables
  const taskAnalysis = parseDeliverables(instruction, workdir);
  task.send({
    type: "log",
    text: `[FractalKernel] Detected targets: ${taskAnalysis.primaryTargets.join(", ")} (${taskAnalysis.subFiles.length} subfile requirements)`,
  });

  // 2. Pre-flight safety net: create early complete skeleton
  await createEarlySkeleton(task, taskAnalysis);

  // 3. Connect to any task MCP servers & build discovered tool catalog
  const mcpMap = new Map();
  const mcpDocs = [];
  if (Array.isArray(mcp_servers)) {
    for (const serverConf of mcp_servers) {
      const client = new McpClient(task, serverConf);
      await client.initialize();
      mcpMap.set(serverConf.name, client);
      if (Array.isArray(client.tools) && client.tools.length > 0) {
        const listed = client.tools.map((t) => {
          const props = Object.keys(t.inputSchema?.properties || {});
          const req = new Set(t.inputSchema?.required || []);
          const sig = props.map((p) => (req.has(p) ? p : `${p}?`)).join(", ");
          return `  - ${t.name}(${sig}): ${(t.description || "").replace(/\s+/g, " ").slice(0, 160)}`;
        });
        mcpDocs.push(`Server '${serverConf.name}':\n${listed.join("\n")}`);
      }
    }
  }

  // 4. Initialize Fractal Manifest Engine
  const engine = new ManifestEngine(task, workdir);
  await engine.initializeSlices(taskAnalysis);

  const tools = mcpMap.size > 0
    ? [...CORE_TOOLS]
    : CORE_TOOLS.filter((t) => t.function.name !== "mcp_call");
  const initialPrompt = mcpDocs.length > 0
    ? `${engine.formatSlicePrompt(instruction)}\n\n[CONNECTED MCP TOOLS — invoke via mcp_call(server, name, arguments)]\n${mcpDocs.join("\n\n")}`
    : engine.formatSlicePrompt(instruction);

  const messages = [
    { role: "system", content: SYSTEM(workdir) },
    { role: "user", content: initialPrompt },
  ];

  let nudges = 0, head = "";
  let auditPerformed = false;
  let forceToolCall = false;
  let turnCount = 0;
  let pacingNudged = false;
  const allowRequiredToolChoice = !MODEL.toLowerCase().includes("claude");

  try {
    while (true) {
    turnCount++;
    const left = task.secondsLeft();
    const wrapUp = left !== null && left < WRAP_UP_SEC;

    if (turnCount >= 12 && !pacingNudged && !wrapUp) {
      pacingNudged = true;
      messages.push({
        role: "user",
        content: `[FRACTAL KERNEL PACING MANDATE]\nYou have completed ${turnCount} turns of reconnaissance. You MUST now transition immediately to Slice 2 (Execution): generate and write complete first-pass deliverable files (e.g. CSVs, BOMs, schedules, reports) directly inside the target output directory in your next turn. Do NOT perform any further exploratory reconnaissance until working deliverables are written to disk.`,
      });
    }

    // Trigger pre-submission hard-gate verification when wrapping up
    if (wrapUp && !auditPerformed) {
      auditPerformed = true;
      const issues = await verifyDeliverables(task, taskAnalysis);
      if (issues.length > 0) {
        task.send({ type: "log", text: `[FractalKernel Audit Warning] ${issues.join("; ")}` });
        messages.push({
          role: "user",
          content: `[FRACTAL KERNEL AUDIT WARNING]\nThe following hard gates failed:\n${issues.join("\n")}\nFix them on disk immediately before your summary.`,
        });
      }
    }

    if (wrapUp && messages.at(-1).content !== WRAP_UP) {
      messages.push({ role: "user", content: WRAP_UP });
    }

    const signal = left === null || wrapUp ? task.abort.signal
      : AbortSignal.any([task.abort.signal, AbortSignal.timeout(Math.round((left - WRAP_UP_SEC) * 1000))]);

    let reply;
    const toolChoice = wrapUp ? "none" : (forceToolCall && allowRequiredToolChoice ? "required" : "auto");
    try {
      reply = await chat(task, messages, tools, toolChoice, signal, (content) => {
        task.summary = head + content;
      });
    } catch (error) {
      if (error instanceof ContextFull && shorten(task, messages)) continue;
      if (task.abort.signal.aborted || !signal.aborted) throw error;
      continue;
    }

    const { message, usage, finish } = reply;
    if (usage) {
      task.send({
        type: "usage",
        model: MODEL,
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        cache_read_tokens: usage.prompt_tokens_details?.cached_tokens ?? 0,
      });
    }

    const text = head + (message.content ?? "");
    if (wrapUp || !message.tool_calls) {
      const cut = finish === "length";
      if (cut) {
        nudges++;
        head = text;
        if (message.content) messages.push(message);
        messages.push({ role: "user", content: "Your reply was cut off; continue where it stopped." });
        continue;
      }

      // 1. Synchronize all on-disk output files into zip archive deliverables
      await syncDeliverablesToZip(task, taskAnalysis);

      // 2. Perform Fractal Kernel Hard-Gate Audit
      const auditIssues = await verifyDeliverables(task, taskAnalysis);
      if (auditIssues.length > 0 && !wrapUp && nudges < MAX_NUDGES) {
        nudges++;
        head = text;
        forceToolCall = true;
        task.send({ type: "log", text: `[FractalKernel Audit] ${auditIssues.length} gap(s) found: ${auditIssues.join("; ")}` });
        if (message.content) messages.push(message);
        messages.push({
          role: "user",
          content: `[FRACTAL KERNEL AUDIT GAPS DETECTED]\n` +
            `Your deliverables are incomplete or missing required data:\n` +
            auditIssues.map((issue) => `- ${issue}`).join("\n") +
            `\n\nACTION REQUIRED: You MUST immediately invoke a tool (e.g. bash to run python scripts, or write_file) in your next turn to generate all required data. Do NOT reply with conversational text only.`,
        });
        continue;
      }

      // If wrap-up or all gates pass or max nudges reached, final sync and complete
      await syncDeliverablesToZip(task, taskAnalysis);
      return;
    }

    nudges = 0;
    forceToolCall = false;
    head = "";
    messages.push(message);

    for (const call of message.tool_calls) {
      task.send({ type: "log", text: `${call.function.name} ${call.function.arguments.slice(0, 200)}` });
      messages.push({ role: "tool", tool_call_id: call.id, content: await runTool(task, call.function, mcpMap) });
    }

      if (left !== null) {
        messages.at(-1).content += `\n[${Math.floor(task.secondsLeft() / 60)} minutes left]`;
      }
    }
  } finally {
    await syncDeliverablesToZip(task, taskAnalysis).catch(() => {});
  }
}

const server = new WebSocketServer({ host: "0.0.0.0", port: Number(process.env.PORT), maxPayload: MAX_FRAME });
server.on("connection", (ws) => {
  let task;
  ws.on("close", () => task?.cancel());
  ws.on("message", (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (task) return task.receive(message);
    if (message?.type !== "task") return ws.send(JSON.stringify({ type: "error", message: "expected a task first" }));
    task = new Task(ws, message);
    solve(task)
      .catch((error) => {
        if (task.finished) return;
        console.error(error);
        task.send({ type: "log", text: `harness error: ${error.message}`.slice(0, 2000) });
        if (!task.summary) task.finish({ type: "error", message: `${error.message}`.slice(0, 2000) });
      })
      .finally(() => task.finish({ type: "done", final_message: task.summary }));
  });
});

console.log(`listening on ${process.env.PORT}`);
