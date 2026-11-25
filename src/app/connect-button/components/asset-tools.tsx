"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { SwapWidget } from "thirdweb/react";
import { client } from "../../../lib/client";

export type AssetToolMode = "swap" | "bridge";

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
  const isSwap = mode === "swap";

  return (
    <section className="asset-tool-page" aria-labelledby="asset-tool-title">
      <header className="asset-tool-heading">
        <div>
          <span className="panel-kicker">THIRDWEB</span>
          <h2 id="asset-tool-title">{isSwap ? "Swap tokens" : "Bridge assets"}</h2>
          <p>{isSwap ? "Exchange tokens across supported networks with thirdweb." : "Move tokens between chains or explore available onramps."}</p>
        </div>
        <span className="version-tag"><span className="version-dot" /> Review before confirming</span>
      </header>
      <div className={`asset-widget-surface${isSwap ? " swap-widget-surface" : " bridge-widget-surface"}`}>
        {isSwap ? <SwapWidget client={client} theme="light" /> : <BridgePanel />}
      </div>
      <p className="asset-tool-note">Review the selected network, token, amount, route, and fees in the widget before approving any transaction.</p>
    </section>
  );
}
