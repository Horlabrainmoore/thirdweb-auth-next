# CoinMarketCap x402 Endpoint Reference

Source: [Official CMC x402 skill repository](https://github.com/coinmarketcap-official/skills-for-ai-agents-by-CoinMarketCap/tree/main/skills/cmc-x402/references/endpoints.md). These endpoints mirror the standard CMC Pro API.

Base URL: `https://pro-api.coinmarketcap.com`

## Cryptocurrency Quotes Latest

**Path:** `GET /x402/v3/cryptocurrency/quotes/latest`

Returns the latest market quote for one or more cryptocurrencies.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Conditional | Comma-separated CMC IDs, e.g. `1,1027` |
| `slug` | string | Conditional | Comma-separated slugs, e.g. `bitcoin,ethereum` |
| `symbol` | string | Conditional | Comma-separated symbols, e.g. `BTC,ETH` |
| `convert` | string | No | Quote currency; defaults to USD |
| `convert_id` | string | No | CMC ID of conversion currency |
| `aux` | string | No | Additional fields to include |
| `skip_invalid` | boolean | No | Skip invalid IDs instead of erroring |

At least one of `id`, `slug`, or `symbol` is required. Returns price, market cap, volume, supply, percent changes, dominance, and fully diluted market cap.

```text
GET /x402/v3/cryptocurrency/quotes/latest?id=1,1027
GET /x402/v3/cryptocurrency/quotes/latest?symbol=BTC,ETH
```

## Cryptocurrency Listings Latest

**Path:** `GET /x402/v3/cryptocurrency/listing/latest`

Returns active cryptocurrencies ranked by market cap.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `start` | integer | No | Pagination offset; defaults to 1 |
| `limit` | integer | No | Results; defaults to 100, max 5000 |
| `price_min`, `price_max` | number | No | Price filters |
| `market_cap_min`, `market_cap_max` | number | No | Market cap filters |
| `volume_24h_min`, `volume_24h_max` | number | No | 24-hour volume filters |
| `convert` | string | No | Quote currency; defaults to USD |
| `sort` | string | No | `market_cap`, `name`, `symbol`, `date_added`, `price`, `volume_24h`, or `percent_change_24h` |
| `sort_dir` | string | No | `asc` or `desc`; defaults to `desc` |
| `cryptocurrency_type` | string | No | `all`, `coins`, or `tokens` |

Returns ranked coin data including price, supply, volume, market cap, and percent changes.

## DEX Search

**Path:** `GET /x402/v1/dex/search`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Token name, symbol, or contract address |
| `network_slug` | string | No | Network, e.g. `ethereum`, `solana`, `bsc`, `base`, `arbitrum`, `polygon` |
| `platform_crypto_id` | integer | No | Alternative network identifier |
| `search_type` | string | No | `token`, `pair`, or `all` |
| `start` | integer | No | Pagination offset; defaults to 1 |
| `limit` | integer | No | Results; defaults to 20, max 100 |

Returns matching tokens and pairs, including network, price, volume, and liquidity where available.

## DEX Pairs Quotes Latest

**Path:** `GET /x402/v4/dex/pairs/quotes/latest`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `pair_address` | string | Yes | DEX pair/pool contract address |
| `network_slug` | string | No | Network identifier |
| `platform_crypto_id` | integer | No | Alternative network identifier |
| `base_address` | string | No | Base token address |
| `quote_address` | string | No | Quote token address |

Returns pair address, DEX name, token details, price, volume, liquidity, fee tier, and transaction counts.
