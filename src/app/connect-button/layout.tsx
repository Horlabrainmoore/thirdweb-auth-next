import type { Metadata, Viewport } from "next";
import "./styles.css";
import { ThirdwebProvider } from "thirdweb/react";

export const metadata: Metadata = {
  title: "Bitcoin Explorer API",
  description: "Explore Bitcoin addresses, transactions and blocks with pay-per-request x402 endpoints.",
  applicationName: "Bitcoin Explorer API",
};

export const viewport: Viewport = {
  themeColor: "#f4f6f8",
  width: "device-width",
  initialScale: 1,
};

export default function ThirdwebProviderLayout({ children }: { children: React.ReactNode }) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}
