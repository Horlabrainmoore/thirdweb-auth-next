---
name: cmc-x402
description: |
  Access CoinMarketCap data through the x402 pay-per-request protocol with USDC payments on Base.
  Use when a user asks for CMC data without an API key, x402 payments, or CMC x402 integration.
  Trigger phrases include x402, pay per request, USDC payment, CMC without subscription, and /cmc-x402.
user-invocable: true
---

# CoinMarketCap x402

Use CoinMarketCap's x402 endpoints to retrieve crypto market data with on-chain USDC payment. No CMC API key or subscription is required. This skill is adapted from the official [CoinMarketCap AI Agent Skills repository](https://github.com/coinmarketcap-official/skills-for-ai-agents-by-CoinMarketCap), licensed under MIT; see `LICENSE`.

## Cost and authorization

- Each successful data request costs **$0.01 USDC on Base** (chain ID 8453). The wallet also needs a small amount of Base ETH for gas.
- Before making any paid request, ensure the user has explicitly asked for that request and understands the per-request charge. Do not make exploratory calls or repeat a paid request without permission.
- A wallet private key authorizes spending. Never ask the user to paste a private key into chat, print it, log it, commit it, or place it in source code. Read it from a secure environment variable or secret store and validate that it is present before creating a signer.
- The reference integration expects a viem-compatible EVM signer. Do not assume an Alchemy session wallet can be used as a private-key signer; use it only if the wallet implementation explicitly supports the x402 signer interface and the user requests that setup.
- Payment occurs on successful delivery. Verify response status and data before summarizing results; never claim a paid request succeeded without a successful response.

## Prerequisites

- Node.js 18+ and npm
- An EVM wallet on Base with user-controlled signing capability
- USDC on Base for requests and a small amount of Base ETH for gas
- Store the wallet secret in an ignored local `.env` file or secure secret manager. Never commit it.

Install the documented SDK packages in the relevant Node project:

```bash
npm install @x402/axios @x402/evm viem dotenv
```

Load `dotenv/config` before reading environment variables, and use `process.env.PRIVATE_KEY`. Do not write a real secret into `.env.example` or a checked-in file.

## Quick start pattern

```ts
import "dotenv/config";
import { createX402AxiosClient } from "@x402/axios";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Set a valid PRIVATE_KEY in the local environment.");
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({ chain: base, transport: http() });
const signer = toClientEvmSigner(account, publicClient);
const client = createX402AxiosClient({
  schemes: [new ExactEvmScheme(signer)],
});

const response = await client.get(
  "https://pro-api.coinmarketcap.com/x402/v3/cryptocurrency/quotes/latest",
  { params: { symbol: "BTC,ETH" } },
);
console.log(response.data);
```

The above request can result in an on-chain charge. Only run it when the user explicitly authorizes the paid request and their wallet is funded.

## Endpoints

Base URL: `https://pro-api.coinmarketcap.com`

| Endpoint | Path | Purpose |
| --- | --- | --- |
| Quotes | `/x402/v3/cryptocurrency/quotes/latest` | Current quotes for one or more coins |
| Listings | `/x402/v3/cryptocurrency/listing/latest` | Ranked cryptocurrency listings |
| DEX Search | `/x402/v1/dex/search` | Search DEX tokens and trading pairs |
| DEX Pair Quotes | `/x402/v4/dex/pairs/quotes/latest` | Quote and trading data for DEX pairs |

Use the endpoint parameter reference in `references/endpoints.md`. Parameters generally follow the matching CMC Pro API endpoint; check the reference for required fields.

## x402-aware MCP

For AI agents, the x402 MCP endpoint is `https://mcp.coinmarketcap.com/x402/mcp` using Streamable HTTP. It requires an x402-aware client/transport. Do not treat the ordinary API-key MCP endpoint as equivalent.

## Payment facts

- Price: $0.01 USDC per successful request
- Network: Base mainnet, chain ID 8453 (`eip155:8453`)
- USDC uses 6 decimals, so the documented amount is 10000 units
- Payment is authorized over HTTP through x402; do not hand-build payment headers when the supported client library can do the exchange

See `references/payment-details.md` for the official documented payment response structure and manual troubleshooting notes.

## When using this skill

1. Clarify the requested asset, endpoint, and parameters if needed.
2. Confirm user authorization before any paid call.
3. Validate inputs and verify the configured wallet environment without revealing its value.
4. Use the supported x402 client, not an API-key header.
5. Report the response and the $0.01 charge accurately. Never present market data as investment advice.

## Sources

- [CoinMarketCap x402 documentation](https://coinmarketcap.com/api/documentation/ai-agent-hub/x402)
- [Official CMC x402 skill](https://coinmarketcap.com/api/documentation/ai-agent-hub/skills/cmc-x402)
- [x402 protocol documentation](https://docs.x402.org)
