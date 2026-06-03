import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server-setup.js";

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Exchange OS Opportunity Agent MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Fatal error running MCP server:", error);
  process.exit(1);
});
