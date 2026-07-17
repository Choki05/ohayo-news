import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface Env {
  AUTH_TOKEN: string;
  MCP_OBJECT: DurableObjectNamespace;
}

export class OhayoNewsMCP extends McpAgent {
  server = new McpServer({
    name: "ohayo-news",
    version: "1.0.0",
  });

  async init() {
    // ここに次のステップでツールを登録する
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const token = url.searchParams.get("token");
    if (token !== env.AUTH_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/mcp") {
      return OhayoNewsMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  },
};
