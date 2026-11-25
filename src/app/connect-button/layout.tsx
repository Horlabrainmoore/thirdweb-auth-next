import type { Metadata, Viewport } from "next";
import "./styles.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./components/theme-provider";

export const metadata: Metadata = {
  title: "Bitcoin Explorer API · BrainPay",
  description:
    "Explore Bitcoin addresses, transactions and blocks with pay-per-request x402 endpoints, live blocks, Lightning / NWC, and thirdweb commerce.",
  applicationName: "Bitcoin Explorer API",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function ConnectButtonLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ThirdwebProvider>
  );
}
