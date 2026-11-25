export const operations = [
  {
    id: "address",
    name: "Address balance",
    group: "Address",
    path: "/x402/btc/address",
    description: "Get BTC address balance and activity summary.",
    example: { address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  },
  {
    id: "address-transactions",
    name: "Address transactions",
    group: "Address",
    path: "/x402/btc/address/transactions",
    description: "Read a page of transactions for a BTC address.",
    example: { address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", limit: 20, offset: 0 },
  },
  {
    id: "transaction",
    name: "Transaction detail",
    group: "Transactions",
    path: "/x402/btc/transaction",
    description: "Look up a single Bitcoin transaction by its transaction ID.",
    example: { txId: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b" },
  },
  {
    id: "transactions",
    name: "Batch transactions",
    group: "Transactions",
    path: "/x402/btc/transactions",
    description: "Look up up to 50 Bitcoin transactions in one request.",
    example: { txIds: ["4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"] },
  },
  {
    id: "block",
    name: "Block detail",
    group: "Blocks",
    path: "/x402/btc/block",
    description: "Look up a block by its hash or height. Choose one identifier.",
    example: { hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f", includeTransactions: false },
  },
  {
    id: "block-transactions",
    name: "Block transactions",
    group: "Blocks",
    path: "/x402/btc/block/transactions",
    description: "Page through a block’s transactions, optionally sorting by index, value, or fees.",
    example: { height: 850000, limit: 15, offset: 0, sort: "index", order: "asc" },
  },
  {
    id: "blocks",
    name: "Latest blocks",
    group: "Blocks",
    path: "/x402/btc/blocks",
    description: "Fetch the latest blocks or continue from a block-height cursor.",
    example: { limit: 10 },
  },
  {
    id: "broadcast",
    name: "Broadcast signed transaction",
    group: "Broadcast",
    path: "/x402/btc/broadcast",
    description: "Submit a signed, hex-encoded Bitcoin transaction to the network.",
    example: { tx: "" },
  },
] as const;

export type OperationId = (typeof operations)[number]["id"];
export type BitcoinOperation = (typeof operations)[number];

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(body: JsonObject, allowed: string[]) {
  return Object.keys(body).every((key) => allowed.includes(key));
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isHash(value: unknown): value is string {
  return typeof value === "string" && /^[\da-f]{64}$/i.test(value);
}

function isAddress(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 10 && value.trim().length <= 128;
}

export function validateOperationBody(operation: OperationId, value: unknown): string | null {
  if (!isObject(value)) return "Request body must be a JSON object.";

  switch (operation) {
    case "address":
      if (!hasOnlyKeys(value, ["address"])) return "Address balance only accepts an address field.";
      return isAddress(value.address) ? null : "Enter a valid-looking Bitcoin address.";

    case "address-transactions":
      if (!hasOnlyKeys(value, ["address", "limit", "offset"])) return "Remove unsupported fields from this request.";
      if (!isAddress(value.address)) return "Enter a valid-looking Bitcoin address.";
      if (value.limit !== undefined && (!isPositiveInteger(value.limit) || value.limit > 50)) return "Limit must be an integer from 1 to 50.";
      if (value.offset !== undefined && !isNonNegativeInteger(value.offset)) return "Offset must be a non-negative integer.";
      return null;

    case "transaction":
      if (!hasOnlyKeys(value, ["txId"])) return "Transaction lookup only accepts a txId field.";
      return isHash(value.txId) ? null : "Transaction ID must be 64 hexadecimal characters.";

    case "transactions":
      if (!hasOnlyKeys(value, ["txIds"])) return "Batch lookup only accepts a txIds field.";
      if (!Array.isArray(value.txIds) || value.txIds.length < 1 || value.txIds.length > 50 || !value.txIds.every(isHash)) {
        return "Provide 1–50 transaction IDs, each 64 hexadecimal characters.";
      }
      return null;

    case "block": {
      if (!hasOnlyKeys(value, ["hash", "height", "includeTransactions"])) return "Remove unsupported fields from this request.";
      const hasHash = value.hash !== undefined;
      const hasHeight = value.height !== undefined;
      if (hasHash === hasHeight) return "Provide exactly one of hash or height.";
      if (hasHash && !isHash(value.hash)) return "Block hash must be 64 hexadecimal characters.";
      if (hasHeight && !isNonNegativeInteger(value.height)) return "Block height must be a non-negative integer.";
      if (value.includeTransactions !== undefined && typeof value.includeTransactions !== "boolean") return "includeTransactions must be true or false.";
      return null;
    }

    case "block-transactions":
      if (!hasOnlyKeys(value, ["hash", "height", "limit", "offset", "sort", "order"])) return "Remove unsupported fields from this request.";
      if ((value.hash === undefined) === (value.height === undefined)) return "Provide exactly one of hash or height.";
      if (value.hash !== undefined && !isHash(value.hash)) return "Block hash must be 64 hexadecimal characters.";
      if (value.height !== undefined && !isNonNegativeInteger(value.height)) return "Block height must be a non-negative integer.";
      if (value.limit !== undefined && (!isPositiveInteger(value.limit) || value.limit > 50)) return "Limit must be an integer from 1 to 50.";
      if (value.offset !== undefined && !isNonNegativeInteger(value.offset)) return "Offset must be a non-negative integer.";
      if (value.sort !== undefined && !["index", "value", "fees"].includes(String(value.sort))) return "Sort must be index, value, or fees.";
      if (value.order !== undefined && !["asc", "desc"].includes(String(value.order))) return "Order must be asc or desc.";
      return null;

    case "blocks":
      if (!hasOnlyKeys(value, ["limit", "after"])) return "Remove unsupported fields from this request.";
      if (value.limit !== undefined && (!isPositiveInteger(value.limit) || value.limit > 50)) return "Limit must be an integer from 1 to 50.";
      if (value.after !== undefined && value.after !== null && !isNonNegativeInteger(value.after)) return "after must be a non-negative block height or null.";
      return null;

    case "broadcast":
      if (!hasOnlyKeys(value, ["tx"])) return "Broadcast only accepts a tx field.";
      return typeof value.tx === "string" && /^(?:[\da-f]{2})+$/i.test(value.tx) && value.tx.length <= 200_000
        ? null
        : "Enter a signed transaction as an even-length hexadecimal string.";
  }
}
