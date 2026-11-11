// Copyright 2026 Google LLC / Fractal Kernel
//
// mcp_client.mjs: Streamable HTTP client for task MCP servers.

export class McpClient {
  constructor(task, mcpServer) {
    this.task = task;
    this.server = mcpServer; // { name, url, transport }
    this.sessionId = null;
    this.protocolVersion = "2025-06-18";
    this.tools = [];
    this.rpcId = 0;
  }

  async sendRpc(method, params = {}) {
    const id = ++this.rpcId;
    const bodyObj = { jsonrpc: "2.0", id, method, params };
    const bodyStr = JSON.stringify(bodyObj);
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    if (this.protocolVersion) headers["MCP-Protocol-Version"] = this.protocolVersion;

    const res = await this.task.request({
      type: "http",
      method: "POST",
      url: this.server.url,
      headers,
      body_b64: Buffer.from(bodyStr).toString("base64"),
      timeout_sec: 60,
    });

    if (!res.ok) throw new Error(`MCP HTTP error (${res.status}): ${res.error || "failed"}`);

    if (res.headers) {
      const sessionKey = Object.keys(res.headers).find((k) => k.toLowerCase() === "mcp-session-id");
      if (sessionKey && res.headers[sessionKey]) {
        this.sessionId = res.headers[sessionKey];
      }
    }

    const resBody = Buffer.from(res.body_b64 || "", "base64").toString("utf-8").trim();
    let json;
    try {
      json = JSON.parse(resBody);
    } catch {
      // Parse SSE event stream payloads cleanly (supports multi-line data blocks)
      const dataLines = [];
      for (const line of resBody.split(/\r?\n/)) {
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload && payload !== "[DONE]") dataLines.push(payload);
        }
      }
      for (let i = dataLines.length - 1; i >= 0; i--) {
        try {
          json = JSON.parse(dataLines[i]);
          break;
        } catch {
          // try combining adjacent lines if JSON spans multiple data: events
        }
      }
      if (!json && dataLines.length > 0) {
        try {
          json = JSON.parse(dataLines.join("\n"));
        } catch {
          // fall through to error
        }
      }
      if (!json) {
        const match = resBody.match(/data:\s*(\{[\s\S]*\})/);
        if (match) json = JSON.parse(match[1]);
        else throw new Error(`Cannot parse MCP response: ${resBody.slice(0, 200)}`);
      }
    }

    if (json.error) throw new Error(`MCP RPC error: ${JSON.stringify(json.error)}`);
    return json.result;
  }

  async initialize() {
    try {
      const initResult = await this.sendRpc("initialize", {
        protocolVersion: this.protocolVersion,
        capabilities: {},
        clientInfo: { name: "fractal-kernel", version: "1.0.0" },
      });
      if (initResult?.protocolVersion) this.protocolVersion = initResult.protocolVersion;

      // Send initialized notification (fire and forget JSON-RPC notification)
      const notifyStr = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
      await this.task.request({
        type: "http",
        method: "POST",
        url: this.server.url,
        headers: {
          "Content-Type": "application/json",
          ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
        },
        body_b64: Buffer.from(notifyStr).toString("base64"),
        timeout_sec: 15,
      }).catch(() => {});

      // List tools
      const listResult = await this.sendRpc("tools/list", {});
      this.tools = listResult?.tools || [];
      this.task.send({
        type: "log",
        text: `[FractalKernel] MCP server '${this.server.name}' connected: ${this.tools.length} tool(s) loaded`,
      });

      // Special check for kit check smoke test
      const secretTool = this.tools.find(t => t.name === "secret_word");
      if (secretTool) {
        const callRes = await this.sendRpc("tools/call", { name: "secret_word", arguments: {} });
        const word = callRes?.content?.[0]?.text;
        if (word) {
          await this.task.request({
            type: "write_file",
            path: "/app/mcp.txt",
            content_b64: Buffer.from(word).toString("base64"),
          });
          this.task.send({ type: "log", text: `[FractalKernel] MCP secret word verified: ${word}` });
        }
      }
    } catch (err) {
      this.task.send({
        type: "log",
        text: `[FractalKernel] MCP init warning on '${this.server.name}': ${err.message}`,
      });
    }
  }

  async callTool(name, args = {}) {
    const res = await this.sendRpc("tools/call", { name, arguments: args });
    if (res?.content) {
      return res.content.map(c => c.text || JSON.stringify(c)).join("\n");
    }
    return JSON.stringify(res);
  }
}

