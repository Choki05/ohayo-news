import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMorningTechNews } from "./sources";

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
    this.server.tool(
      "get_morning_tech_news",
      "GitHub Trending, Hacker News, Zenn, Qiitaから今日の技術系トレンド記事を各ソース最大8件ずつ取得する。朝の挨拶をされたときに呼び出す。取得した記事は一部を選んでまとめるのではなく、返ってきた記事を1件も省略せずにすべて列挙すること。各記事ごとに、タイトルと元記事へのリンクに加えて、2〜3文程度の具体的な日本語要約を付けること。",
      async () => {
        const text = await getMorningTechNews();
        return {
          content: [{ type: "text", text}],
        };
      }
    );
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
