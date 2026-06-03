# Panduan Registrasi & Deployment: MCP Server ke OKX Marketplace (A2MCP)

Dokumen ini memandu Anda dalam mempersiapkan, melakukan deployment, dan mendaftarkan **Exchange OS Opportunity Agent MCP Server** ke **OKX MCP Marketplace** sebagai layanan **A2MCP** berbayar (x402).

---

## 1. Persiapan Infrastruktur (Deployment Shape)

Secara default, MCP Server dikembangkan menggunakan `StdioServerTransport` untuk komunikasi lokal (stdin/stdout). Agar dapat diakses oleh OKX Developer Portal atau AI Agent lain dari luar secara remote, server harus diexpose menggunakan protokol berbasis jaringan, seperti **SSE (Server-Sent Events)** atau **Websocket**.

### Opsi A: Menggunakan SSE (Server-Sent Events) - Direkomendasikan
Model Context Protocol SDK secara native mendukung `SSEServerTransport`. Anda dapat membungkus server kita menggunakan Express atau Hono.

Berikut adalah contoh modifikasi `src/index.ts` untuk mendukung SSE:
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
const server = new Server({ name: "exchangeos-oracle", version: "1.0.0" }, { capabilities: { tools: {} } });

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handleMessage(req, res);
});

app.listen(3000, () => {
  console.log("MCP Server running on SSE at http://localhost:3000/sse");
});
```

### Opsi B: HTTP REST Gateway
Anda juga dapat mendeploy endpoint HTTP REST standar di server VPS (seperti AWS, DigitalOcean, atau Vercel) yang menerima request JSON-RPC MCP, lalu memprosesnya dan membalasnya dengan skema response MCP JSON-RPC.

---

## 2. Langkah Registrasi di OKX Developer Portal

Setelah server Anda dideploy secara publik (misal di `https://api.oracle-exchangeos.xyz/sse`), ikuti langkah berikut untuk mendaftarkannya ke Marketplace:

### Langkah 1: Masuk ke OKX Developer Portal
1. Buka [OKX Developer Portal](https://web3.okx.com/onchainos/dev-portal).
2. Lakukan koneksi menggunakan akun developer Anda atau hubungkan EVM Wallet Anda.

### Langkah 2: Daftarkan Layanan A2MCP Baru
1. Masuk ke tab **MCP Marketplace Management** -> **My Listed Services**.
2. Klik tombol **"Create New Service"** atau **"Register A2MCP Endpoint"**.
3. Isi informasi detail layanan:
   * **Service Title**: `Exchange OS Arbitrage & Sweeps Oracle`
   * **Description**: `Provides real-time arbitrage spreads between Exchange OS prediction markets and live spot indices. Includes late-stage sweep signals for deterministic wins.`
   * **Service Type**: Pilih **A2MCP** (Agent-to-MCP).
   * **Endpoint URL**: `https://api.oracle-exchangeos.xyz/sse` (atau endpoint SSE/HTTP publik Anda).

### Langkah 3: Konfigurasi Skema Pembayaran (x402 Settings)
Pada bagian monetisasi/payment, masukkan detail penarifan mikro-transaksi Anda:
* **Asset/Token**: `USDT (X Layer)` -> Address: `0x74b7f16337b8972027f6196a17a631ac6de26d22`
* **Network**: `EIP-155:196` (X Layer L2)
* **Price Per Request**: `0.01` USDT (atau isi `10000` dalam satuan terkecil / 6 desimal).
* **Payout Wallet Address**: Masukkan wallet developer Anda (misalnya `0x2F8a25AC62179b31d62D7f80884aE57464699059`). Ini adalah address yang akan menerima USDT setiap kali AI Agent memanggil tool Anda.

### Langkah 4: Tentukan Skema Tool & Metadata
Copypaste skema input-output dari file [mcp-creator-blueprint.md](file:///opt/exchangeos-opportunity-agent/docs/mcp-creator-blueprint.md) untuk mendefinisikan parameter:
* `check_arbitrage_opportunity` (dengan parameter `tokenSymbol`)
* `get_late_stage_sweeps` (dengan parameter `maxPrice`)

---

## 3. Alur Eksekusi Transaksi (Runtime Flow)

Setiap kali AI Agent memanggil tool Anda di marketplace, sistem Onchain OS akan memprosesnya melalui siklus berikut:

```
[ AI Agent Client ]
        │
        ▼ (Panggilan Pertama: Tanpa Token Pembayaran)
[ OKX MCP Gateway ] ──> Meneruskan ke ──> [ Server MCP Anda ]
                                                   │
                                                   ▼ (Deteksi Tanpa Pembayaran)
                                          [ Return HTTP 402 ]
                                                   │
        ┌──────────────────────────────────────────┘
        ▼
[ OKX Onchain OS / TEE Wallet Client ]
        │
        ▼ (Mengotorisasi & Menandatangani EIP-3009 Transaksi 0.01 USDT)
[ Kirim Bukti Tanda Tangan ]
        │
        ▼ (Panggilan Kedua: Dengan paymentPayload)
[ OKX MCP Gateway ] ──> Meneruskan ke ──> [ Server MCP Anda ]
                                                   │
                                                   ▼ (Verifikasi Signature Sukses)
                                          [ Return Premium Data ]
```

---

## 4. Keuntungan & Skalabilitas Rute Kreator

Dengan mendeploy layanan ini, Anda memiliki keunggulan kompetitif sebagai penyedia data tangan pertama di ekosistem X Layer:
1. **Bebas Risiko Likuiditas**: Anda tidak perlu memasang kapital trading sendiri untuk menghasilkan profit. Anda mendapat penghasilan dari biaya query (0.01 USDT per call) yang dibayarkan oleh puluhan/ratusan bot trading otomatis.
2. **Akumulasi Otomatis**: Hasil akumulasi biaya query dikirim langsung ke TEE Developer Wallet Anda di X Layer secara real-time.
3. **Optimasi Infrastruktur**: Karena X Layer memiliki gas fee yang sangat kecil (kurang dari $0.001 per transaksi), transaksi pembayaran x402 via EIP-3009 transfer authorization dapat dieksekusi dengan efisiensi tinggi oleh AI Agent.
