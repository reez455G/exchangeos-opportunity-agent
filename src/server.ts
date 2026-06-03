import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { server } from "./server-setup.js";

const app = express();
app.use(express.json());

let transport: SSEServerTransport | null = null;

// SSE route to establish connection
app.get("/sse", async (req, res) => {
  console.log("New client connecting via SSE");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Messages route to receive client commands
app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400).send("SSE connection not established");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Exchange OS Opportunity Agent MCP Server (SSE Mode)`);
  console.log(`- Connection URL: http://localhost:${PORT}/sse`);
  console.log(`- Message URL:    http://localhost:${PORT}/messages\n`);
  console.log(`To expose this server to the OKX Developer Portal / Internet:`);
  console.log(`Run: ngrok http ${PORT}`);
});
