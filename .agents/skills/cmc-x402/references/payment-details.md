# CoinMarketCap x402 Payment Details

Source: [Official CMC x402 skill repository](https://github.com/coinmarketcap-official/skills-for-ai-agents-by-CoinMarketCap/tree/main/skills/cmc-x402/references/payment-details.md). Confirm current terms with CMC before production use.

## Documented Payment Flow

1. Request an x402 endpoint.
2. Without a valid payment, the server returns HTTP 402 and a `Payment-Required` header.
3. The wallet signs a USDC `transferWithAuthorization` (EIP-3009) message.
4. The x402 client retries with a signed `PAYMENT-SIGNATURE` header.
5. The server verifies payment and returns data.
6. The on-chain transfer executes only on successful delivery, as described by CMC.

Use the supported x402 client library to handle this exchange; avoid manually constructing signatures or payment headers unless explicitly troubleshooting the protocol.

## Documented Configuration

| Field | Value |
|---|---|
| Network | Base mainnet (chain ID 8453, CAIP-2 `eip155:8453`) |
| Asset | USDC |
| USDC contract | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Payment recipient | `0x271189c860DB25bC43173B0335784aD68a680908` |
| Amount | `10000` units ($0.01 USDC with 6 decimals) |
| Method | EIP-3009 `transferWithAuthorization` |

These are source-documented details, not instructions to initiate payment. Always confirm the user wants a paid request before signing.

## Payment-Required response example

The source documents a base64-encoded `Payment-Required` header and an equivalent decoded payload shaped like:

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "amount": "10000",
      "payTo": "0x271189c860DB25bC43173B0335784aD68a680908",
      "maxTimeoutSeconds": 30,
      "extra": { "name": "USD Coin", "version": "2" }
    }
  ]
}
```

## Security notes

- A signed authorization is spending authority. Keep its private key and signature material out of source control, logs, and chat.
- The documented authorization validity window is typically 30 seconds. Unused authorizations expire; do not assume stale payment payloads remain valid.
- Do not treat an HTTP 402 response itself as a completed payment.
