# Exchange OS Opportunity Agent

An AI-powered agent and MCP (Model Context Protocol) server designed to scan, analyze, and execute profitable arbitrage opportunities on OKX **Exchange OS** and **Onchain OS** platforms (built on X Layer).

## Features
- **Arbitrage Scan**: Checks pricing discrepancies between prediction markets (Exchange OS) and spot prices on OKX DEX.
- **Agentic Wallet Integration**: Connects to OKX's secure, TEE-protected Agentic Wallet on X Layer.
- **Early Cashout Simulator**: Simulates expected returns from the "Sweeper" strategy (buying late-stage decided shares at a discount).

## Tech Stack
- Runtime: Node.js (v18+)
- Language: TypeScript
- Framework: @modelcontextprotocol/sdk

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:reez455G/exchangeos-opportunity-agent.git
   cd exchangeos-opportunity-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your settings:
   ```bash
   cp .env.example .env
   ```

---

## Development and Building

To run the server in development mode:
```bash
npm run dev
```

To compile TypeScript into JavaScript:
```bash
npm run build
```

To run the built JavaScript server:
```bash
npm run start
```

---

## Linking to AI Agents

You can link this MCP server to **Claude Desktop** or other compatible agents. 

Add the following block to your Claude Desktop config (e.g., `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "exchangeos-opportunity-agent": {
      "command": "node",
      "args": ["/opt/exchangeos-opportunity-agent/dist/index.js"]
    }
  }
}
```
*(Make sure to run `npm run build` in the project directory first to generate the compiled JS files).*
