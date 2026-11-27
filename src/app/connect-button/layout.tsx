import type { Metadata, Viewport } from "next";
import "./styles.css";
import { ThirdwebProvider } from "thirdweb/react";

export const metadata: Metadata = {
  title: "Thirdweb Onchain Console",
  description: "Explore Bitcoin APIs, connect a wallet, and chat with a thirdweb AI assistant for onchain help.",
  applicationName: "Thirdweb Onchain Console",
};

export const viewport: Viewport = {
  themeColor: "#f4f6f8",
  width: "device-width",
  initialScale: 1,
};

export default function ThirdwebProviderLayout({ children }: { children: React.ReactNode }) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}
