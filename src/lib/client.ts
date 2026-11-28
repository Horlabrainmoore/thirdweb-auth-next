import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID?.trim();
const secretKey = process.env.THIRDWEB_SECRET_KEY?.trim();

// thirdweb client. Point the project’s RPC in the thirdweb dashboard at Alchemy
// (or use alchemyRpcUrl below for custom chain definitions / server scripts).
export const client = createThirdwebClient(
  secretKey
    ? { secretKey }
    : {
        clientId: clientId || "build-placeholder",
      },
);

/** Optional Alchemy HTTP RPC helper for server-side or scripts */
export function alchemyRpcUrl(
  network: "eth-mainnet" | "base-mainnet" | "polygon-mainnet" = "base-mainnet",
) {
  const key = process.env.ALCHEMY_API_KEY?.trim();
  if (!key) return null;
  return `https://${network}.g.alchemy.com/v2/${encodeURIComponent(key)}`;
}
