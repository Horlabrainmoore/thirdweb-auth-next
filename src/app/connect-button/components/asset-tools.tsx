"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getContract } from "thirdweb";
import { arbitrum, polygon } from "thirdweb/chains";
import { transfer } from "thirdweb/extensions/erc20";
import { BuyWidget, CheckoutWidget, SwapWidget, TransactionWidget, useActiveAccount } from "thirdweb/react";
import { client } from "../../../lib/client";

export type AssetToolMode = "swap" | "bridge" | "buy" | "checkout" | "transfer";

const polygonUsdc = getContract({
  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  chain: polygon,
  client,
});

function TokenTransferPanel() {
  const account = useActiveAccount();
  const [recipient, setRecipient] = useState("");
  const validRecipient = /^0x[a-fA-F0-9]{40}$/.test(recipient.trim()) && recipient.trim().toLowerCase() !== account?.address.toLowerCase();

  return (
    <div className="transfer-widget-content">
      <div className="transfer-details">
        <div className="transfer-token-mark" aria-hidden="true">$</div>
        <div><strong>USDC on Polygon</strong><span>Example transfer amount: 50 USDC</span></div>
      </div>
      <label className="transfer-recipient-label" htmlFor="transfer-recipient">Recipient wallet address</label>
      <input
        id="transfer-recipient"
        className="transfer-recipient-input"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="0x…"
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        aria-describedby="transfer-warning"
      />
      <p id="transfer-warning" className="transfer-warning">This sends 50 USDC from your connected wallet on Polygon to the address above. Verify the network, recipient, and amount in your wallet before approving.</p>
      {account && validRecipient ? (
        <TransactionWidget
          client={client}
          transaction={transfer({ contract: polygonUsdc, amount: "50", to: recipient.trim() as `0x${string}` })}
        />
      ) : (
        <p className="transfer-state" role="status">
          {!account ? "Connect your wallet to prepare a transfer." : recipient.trim() && !validRecipient ? "Enter a valid external wallet address." : "Enter an external recipient address to continue."}
        </p>
      )}
    </div>
  );
}

type BridgeWidgetOptions = {
  clientId: string;
  theme: "light";
};

declare global {
  interface Window {
    BridgeWidget?: {
      render: (container: HTMLElement, options: BridgeWidgetOptions) => unknown;
    };
  }
}

function BridgePanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID?.trim();

  useEffect(() => {
    const container = containerRef.current;
    if (!scriptReady || !container) return;
    if (!clientId) {
      setError("Add a thirdweb client ID to enable the Bridge widget.");
      return;
    }
    if (!window.BridgeWidget) {
      setError("The Bridge widget could not be loaded. Refresh and try again.");
      return;
    }

    try {
      window.BridgeWidget.render(container, { clientId, theme: "light" });
      setError("");
    } catch {
      setError("The Bridge widget could not start. Refresh and try again.");
    }

    return () => container.replaceChildren();
  }, [clientId, scriptReady]);

  return (
    <>
      <Script
        src="https://unpkg.com/thirdweb/dist/scripts/bridge-widget.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("The Bridge widget script could not be loaded.")}
      />
      <div ref={containerRef} id="bridge-widget-container" className="bridge-widget-container" aria-label="Cross-chain bridge" />
      {error && <p className="widget-error" role="alert">{error}</p>}
    </>
  );
}

export function AssetTools({ mode }: { mode: AssetToolMode }) {
  const account = useActiveAccount();
  const config = {
    swap: { title: "Swap tokens", description: "Exchange tokens across supported networks with thirdweb." },
    bridge: { title: "Bridge assets", description: "Move tokens between chains or explore available onramps." },
    buy: { title: "Buy crypto", description: "Explore supported ways to fund a wallet with crypto or fiat." },
    checkout: { title: "Checkout", description: "Pay in USD for a purchase using your connected wallet." },
    transfer: { title: "Send USDC", description: "Prepare a direct USDC transfer to an external Polygon wallet." },
  }[mode];

  return (
    <section className="asset-tool-page" aria-labelledby="asset-tool-title">
      <header className="asset-tool-heading">
        <div>
          <span className="panel-kicker">THIRDWEB</span>
          <h2 id="asset-tool-title">{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <span className="version-tag"><span className="version-dot" /> Review before confirming</span>
      </header>
      <div className={`asset-widget-surface ${mode}-widget-surface`}>
        {mode === "swap" && <SwapWidget client={client} theme="light" />}
        {mode === "bridge" && <BridgePanel />}
        {mode === "buy" && <BuyWidget client={client} currency="USD" chain={arbitrum} amount="0.002" />}
        {mode === "checkout" && (account ? (
          <CheckoutWidget client={client} currency="USD" chain={arbitrum} amount="0.01" seller={account.address as `0x${string}`} />
        ) : (
          <p className="transfer-state" role="status">Connect your wallet to open checkout. The connected wallet will be used as the seller address.</p>
        ))}
        {mode === "transfer" && <TokenTransferPanel />}
      </div>
      <p className="asset-tool-note">Review the selected network, token, amount, destination, and fees in the widget before approving any transaction. Wallet transactions are final once confirmed.</p>
    </section>
  );
}
