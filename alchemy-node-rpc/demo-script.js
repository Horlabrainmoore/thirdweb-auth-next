import "dotenv/config";

const apiKey = process.env.ALCHEMY_API_KEY;

if (!apiKey || apiKey === "<my-key>") {
  console.error("Missing ALCHEMY_API_KEY. Add your key to alchemy-node-rpc/.env first.");
  process.exit(1);
}

const rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${encodeURIComponent(apiKey)}`;
let requestId = 0;

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++requestId,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy HTTP error: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC ${payload.error.code}: ${payload.error.message}`);
  }
  if (payload.result === undefined || payload.result === null) {
    throw new Error(`RPC ${method} returned no result`);
  }

  return payload.result;
}

try {
  const blockNumber = await rpc("eth_blockNumber");
  const block = await rpc("eth_getBlockByNumber", [blockNumber, false]);

  if (!block) {
    throw new Error(`Block ${blockNumber} was not found`);
  }

  const timestamp = Number(BigInt(block.timestamp));
  console.log("Connected to Ethereum Mainnet through Alchemy.");
  console.log(`Latest block: ${BigInt(blockNumber).toString()} (${blockNumber})`);
  console.log(`Block hash: ${block.hash}`);
  console.log(`Timestamp: ${new Date(timestamp * 1000).toISOString()}`);
  console.log(`Transactions in block: ${block.transactions.length}`);
} catch (error) {
  console.error("Alchemy RPC request failed:", error.message);
  process.exitCode = 1;
}
