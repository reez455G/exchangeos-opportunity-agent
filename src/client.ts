import { spawn } from "child_process";
import readline from "readline";

// Standard JSON-RPC request helper
function createJsonRpcRequest(method: string, params: any, id: number) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method,
    params,
    id,
  }) + "\n";
}

async function runSimulation() {
  console.log("==================================================");
  console.log("OKX ONCHAIN OS / APP PROTOCOL CLIENT SIMULATION");
  console.log("==================================================");

  // 1. Spawn MCP server process
  console.log("\n[1/5] Spawning MCP Server subprocess...");
  const serverProcess = spawn("node", ["dist/index.js"]);

  const rl = readline.createInterface({
    input: serverProcess.stdout,
    terminal: false,
  });

  serverProcess.stderr.on("data", (data) => {
    console.log(`[Server Log] ${data.toString().trim()}`);
  });

  // Helper to send a request and wait for the response
  const sendRequest = (requestStr: string): Promise<any> => {
    return new Promise((resolve) => {
      rl.once("line", (line) => {
        try {
          resolve(JSON.parse(line));
        } catch (e) {
          resolve({ error: "Failed to parse JSON response: " + line });
        }
      });
      serverProcess.stdin.write(requestStr);
    });
  };

  // Wait a moment for server to boot up
  await new Promise((r) => setTimeout(r, 1000));

  let requestId = 1;

  // 2. Call tool without payment
  console.log("\n[2/5] Calling check_arbitrage_opportunity for 'BTC' WITHOUT payment...");
  const callParamsWithoutPayment = {
    name: "check_arbitrage_opportunity",
    arguments: {
      tokenSymbol: "BTC",
    },
  };

  const req1 = createJsonRpcRequest("tools/call", callParamsWithoutPayment, requestId++);
  const res1 = await sendRequest(req1);

  console.log("Server Response:");
  console.log(JSON.stringify(res1, null, 2));

  // Parse the 402 status from text content
  const responseText = res1.result?.content?.[0]?.text;
  if (!responseText) {
    console.error("Error: Unexpected response structure from server", res1);
    serverProcess.kill();
    return;
  }

  const paymentReq = JSON.parse(responseText);
  if (paymentReq.status !== 402) {
    console.error(`Expected 402 Payment Required, got ${paymentReq.status}`);
    serverProcess.kill();
    return;
  }

  console.log("\n[3/5] Intercepted 402 Payment Required successfully!");
  const acceptedScheme = paymentReq.accepts[0];
  console.log(`- Required Asset: ${acceptedScheme.asset} (USDT on X Layer)`);
  console.log(`- Amount: ${acceptedScheme.amount} (0.01 USDT)`);
  console.log(`- Pay To Wallet: ${acceptedScheme.payTo}`);

  // 3. Construct EIP-3009 payment payload
  console.log("\n[4/5] Simulating Agentic Wallet signing of EIP-3009 payment payload...");
  const mockPaymentPayload = {
    x402Version: 2,
    accepted: {
      network: acceptedScheme.network,
      asset: acceptedScheme.asset,
      amount: acceptedScheme.amount,
      payTo: acceptedScheme.payTo,
    },
    payload: {
      signature: "0xabc123789deffedcba9876543210fedcba9876543210abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde1b",
      authorization: {
        to: acceptedScheme.payTo,
        value: acceptedScheme.amount,
        nonce: "0x" + Math.floor(Math.random() * 1000000).toString(16),
        validAfter: Math.floor(Date.now() / 1000) - 60,
        validBefore: Math.floor(Date.now() / 1000) + 3600,
      },
    },
  };

  // 4. Submit query with payment payload
  console.log("\n[5/5] Submitting tool call WITH payment payload...");
  const callParamsWithPayment = {
    name: "check_arbitrage_opportunity",
    arguments: {
      tokenSymbol: "BTC",
      paymentPayload: mockPaymentPayload,
    },
  };

  const req2 = createJsonRpcRequest("tools/call", callParamsWithPayment, requestId++);
  const res2 = await sendRequest(req2);

  console.log("Server Response:");
  console.log(JSON.stringify(res2, null, 2));

  // Verify successful decryption / return of data
  const resultText = res2.result?.content?.[0]?.text;
  if (resultText) {
    const finalData = JSON.parse(resultText);
    if (finalData.status === "success") {
      console.log("\n🎉 End-to-end payment validation and tool execution SUCCESSFUL!");
      console.log(`- Token Spot Price: $${finalData.spotPriceDetails.price} (${finalData.spotPriceDetails.source})`);
      console.log(`- Market Spread: ${finalData.opportunities[0].spreadPercent}%`);
      console.log(`- Recommended Hedging Action: ${finalData.opportunities[0].action}`);
    } else {
      console.error("\n❌ Tool call failed despite payment payload.");
    }
  } else {
    console.error("\n❌ Expected success content, but response was empty or errored.", res2);
  }

  // Cleanup server process
  serverProcess.kill();
}

runSimulation().catch(console.error);
