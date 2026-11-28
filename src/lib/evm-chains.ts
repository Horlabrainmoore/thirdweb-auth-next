import { defineChain } from "thirdweb";

export const baseChain = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpc: "https://mainnet.base.org",
  blockExplorers: [{ name: "BaseScan", url: "https://basescan.org" }],
});

export const tempoMainnet = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "US Dollar", symbol: "USD", decimals: 18 },
  rpc: "https://rpc.tempo.xyz",
  blockExplorers: [{ name: "Tempo Explorer", url: "https://explore.tempo.xyz" }],
});

export const tempoModerato = defineChain({
  id: 42431,
  name: "Tempo Moderato",
  nativeCurrency: { name: "US Dollar", symbol: "USD", decimals: 18 },
  rpc: "https://rpc.moderato.tempo.xyz",
  blockExplorers: [{ name: "Tempo Testnet Explorer", url: "https://explore.testnet.tempo.xyz" }],
  testnet: true,
});

export const supportedEvmChains = [baseChain, tempoMainnet, tempoModerato] as const;
export type SupportedEvmChainId = (typeof supportedEvmChains)[number]["id"];

export const supportedEvmChainIds = supportedEvmChains.map((chain) => chain.id) as SupportedEvmChainId[];

export function getSupportedEvmChain(chainId: number) {
  return supportedEvmChains.find((chain) => chain.id === chainId);
}

export function getSupportedEvmChainName(chainId: number) {
  return getSupportedEvmChain(chainId)?.name ?? `Chain ${chainId}`;
}
