"use client";

import { useMemo, useState } from "react";
import { AssetTools, type AssetToolMode } from "./asset-tools";
import { ExactEvmScheme, type ClientEvmSigner } from "@x402/evm";
import { x402Client } from "@x402/core/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { supportedEvmChains, baseChain } from "../../../lib/evm-chains";
import { client as thirdwebClient } from "../../../lib/client";
import { operations, validateOperationBody, type OperationId } from "../../../lib/bitcoin-operations";
import { ThirdwebChat } from "./thirdweb-chat";

type ApiResult = {
  status: number;
  body: unknown;
  paid: boolean;
  durationMs: number;
};

const endpointGroups = ["Address", "Transactions", "Blocks", "Broadcast"] as const;

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function ConsoleDashboard() {
  const account = useActiveAccount();
  const [selectedId, setSelectedId] = useState<OperationId>("address");
  const [activeTool, setActiveTool] = useState<"api" | "chat" | AssetToolMode>("api");
  const [requestBody, setRequestBody] = useState(prettyJson(operations[0].example));
  const [approvePayment, setApprovePayment] = useState(false);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);
  const [broadcastPhrase, setBroadcastPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const selected = useMemo(() => operations.find((operation) => operation.id === selectedId) ?? operations[0], [selectedId]);
  const broadcastReady = selectedId !== "broadcast" || (confirmBroadcast && broadcastPhrase === "BROADCAST");

  const selectOperation = (id: OperationId) => {
    const operation = operations.find((item) => item.id === id);
    if (!operation) return;
    setSelectedId(id);
    setRequestBody(prettyJson(operation.example));
    setApprovePayment(false);
    setConfirmBroadcast(false);
    setBroadcastPhrase("");
    setError("");
    setResult(null);
  };

  const restoreExample = () => {
    setRequestBody(prettyJson(selected.example));
    setError("");
  };

  const executeRequest = async () => {
    setError("");
    setResult(null);
    if (!account) {
      setError("Connect a wallet before sending a paid request.");
      return;
    }
    if (!approvePayment) {
      setError("Approve this single request before continuing.");
      return;
    }
    if (!broadcastReady) {
      setError("Confirm the signed transaction and type BROADCAST to continue.");
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(requestBody);
    } catch {
      setError("Request body must be valid JSON.");
      return;
    }
    const validationError = validateOperationBody(selectedId, body);
    if (validationError) {
      setError(validationError);
      return;
    }

    const startedAt = performance.now();
    setLoading(true);
    try {
      const signer: ClientEvmSigner = {
        address: account.address as `0x${string}`,
        signTypedData: (typedData) => account.signTypedData(typedData as never),
      };
      const paymentClient = new x402Client()
        .register("eip155:8453", new ExactEvmScheme(signer))
        .setSpendControls({ maxAmountPerPayment: "$0.005" });
      const paidFetch = wrapFetchWithPayment(fetch, paymentClient);
      const response = await paidFetch(`/api/bitcoin/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, confirmedBroadcast: selectedId === "broadcast" && broadcastReady }),
      });
      const text = await response.text();
      let responseBody: unknown = text;
      if (text) {
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      }
      setResult({
        status: response.status,
        body: responseBody,
        paid: Boolean(response.headers.get("payment-response")),
        durationMs: Math.round(performance.now() - startedAt),
      });
      if (!response.ok) {
        const message = typeof responseBody === "object" && responseBody !== null && "error" in responseBody
          ? String(responseBody.error)
          : `The API returned HTTP ${response.status}.`;
        setError(message);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setLoading(false);
      setApprovePayment(false);
    }
  };

  return (
    <div className="btc-shell">
      <header className="btc-topbar">
        <a className="btc-brand" href="/" aria-label="Bitcoin Explorer API home">
          <span className="btc-brand-mark">₿</span>
          <span>Explorer <strong>API</strong></span>
        </a>
        <div className="topbar-center"><span className="network-dot" /> Bitcoin mainnet <span className="topbar-divider">/</span> x402 v2</div>
        <div className="topbar-wallet">
          <ConnectButton client={thirdwebClient} chain={baseChain} chains={[...supportedEvmChains]} autoConnect={false} connectButton={{ label: "Connect wallet" }} />
        </div>
      </header>

      <div className="btc-layout">
        <aside className="operations-sidebar" aria-label="Bitcoin operations">
          <div className="sidebar-title">
            <span className="overline">API CATALOG</span>
            <h1>BitcoinOperations</h1>
            <p>Blockchain explorer · 8 endpoints</p>
          </div>
          <nav className="operation-nav" aria-label="Bitcoin endpoint list">
            {endpointGroups.map((group) => (
              <div className="operation-group" key={group}>
                <h2>{group}</h2>
                {operations.filter((operation) => operation.group === group).map((operation) => (
                  <button
                    type="button"
                    key={operation.id}
                    className={`operation-link${selectedId === operation.id ? " is-active" : ""}`}
                    onClick={() => selectOperation(operation.id)}
                    aria-pressed={selectedId === operation.id}
                  >
                    <span className="operation-link-dot" />
                    <span>{operation.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-footnote">
            <span className="sidebar-footnote-mark">i</span>
            <p>Each paid call is capped at <strong>$0.005 USDC</strong>. Your wallet approves every request.</p>
          </div>
        </aside>

        <main className="operation-main">
          <nav className="tool-tabs" aria-label="Thirdweb tools">
            <button type="button" className={`tool-tab${activeTool === "api" ? " is-active" : ""}`} onClick={() => setActiveTool("api")} aria-current={activeTool === "api" ? "page" : undefined}>API Explorer</button>
            <button type="button" className={`tool-tab${activeTool === "swap" ? " is-active" : ""}`} onClick={() => setActiveTool("swap")} aria-current={activeTool === "swap" ? "page" : undefined}>Swap</button>
            <button type="button" className={`tool-tab${activeTool === "bridge" ? " is-active" : ""}`} onClick={() => setActiveTool("bridge")} aria-current={activeTool === "bridge" ? "page" : undefined}>Bridge</button>
            <button type="button" className={`tool-tab${activeTool === "buy" ? " is-active" : ""}`} onClick={() => setActiveTool("buy")} aria-current={activeTool === "buy" ? "page" : undefined}>Buy</button>
            <button type="button" className={`tool-tab${activeTool === "checkout" ? " is-active" : ""}`} onClick={() => setActiveTool("checkout")} aria-current={activeTool === "checkout" ? "page" : undefined}>Checkout</button>
            <button type="button" className={`tool-tab${activeTool === "transfer" ? " is-active" : ""}`} onClick={() => setActiveTool("transfer")} aria-current={activeTool === "transfer" ? "page" : undefined}>Transfer</button>
            <button type="button" className={`tool-tab${activeTool === "chat" ? " is-active" : ""}`} onClick={() => setActiveTool("chat")} aria-current={activeTool === "chat" ? "page" : undefined}>AI Assistant</button>
          </nav>
          {activeTool === "api" ? <>
          <div className="page-heading">
            <div>
              <div className="breadcrumbs"><span>API Reference</span><span>/</span><strong>BitcoinOperations</strong></div>
              <h2>Bitcoin endpoints</h2>
              <p>Read addresses, transactions and blocks—or broadcast a signed transaction.</p>
            </div>
            <span className="version-tag"><span className="version-dot" /> x402 v2</span>
          </div>

          <div className="endpoint-heading">
            <div className="endpoint-route"><span className="method-badge">POST</span><code>{selected.path}</code></div>
            <span className="request-cost">≤ $0.005 <span>per request</span></span>
          </div>

          <div className="request-response-grid">
            <section className="surface request-panel" aria-labelledby="request-title">
              <div className="panel-head">
                <div><span className="panel-kicker">REQUEST</span><h3 id="request-title">{selected.name}</h3><p>{selected.description}</p></div>
                <button type="button" className="quiet-button" onClick={restoreExample}>Restore example</button>
              </div>
              <div className="editor-label-row"><label htmlFor="request-json">JSON body</label><span>application/json</span></div>
              <textarea
                id="request-json"
                className="json-editor"
                value={requestBody}
                onChange={(event) => setRequestBody(event.target.value)}
                spellCheck={false}
                aria-describedby="body-hint"
              />
              <p id="body-hint" className="editor-hint">Use the endpoint&apos;s documented fields. The example is editable before submission.</p>

              <div className="payment-callout">
                <span className="payment-icon" aria-hidden="true">$</span>
                <div><strong>One request, one approval</strong><p>Payment is signed by your connected wallet on Base. The client refuses any request above the $0.005 cap.</p></div>
              </div>
              <label className="approval-row">
                <input type="checkbox" checked={approvePayment} onChange={(event) => setApprovePayment(event.target.checked)} />
                <span>I approve this single request for up to <strong>$0.005 USDC</strong>.</span>
              </label>
              {selectedId === "broadcast" && (
                <div className="broadcast-approval">
                  <label className="approval-row">
                    <input type="checkbox" checked={confirmBroadcast} onChange={(event) => setConfirmBroadcast(event.target.checked)} />
                    <span>I understand this will broadcast a signed transaction and cannot be undone.</span>
                  </label>
                  <label className="phrase-label" htmlFor="broadcast-confirmation">Type BROADCAST to confirm</label>
                  <input
                    id="broadcast-confirmation"
                    className="phrase-input"
                    value={broadcastPhrase}
                    onChange={(event) => setBroadcastPhrase(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="button" className="execute-button" onClick={executeRequest} disabled={loading || !account || !approvePayment || !broadcastReady}>
                <span>{loading ? "Waiting for wallet approval…" : "Authorize & send request"}</span>
                {!loading && <span aria-hidden="true">↗</span>}
              </button>
              <p className="execute-note">No request is sent until you approve above and confirm in your wallet.</p>
            </section>

            <section className="surface response-panel" aria-labelledby="response-title">
              <div className="panel-head response-head">
                <div><span className="panel-kicker">OUTPUT</span><h3 id="response-title">Response</h3></div>
                {result && <span className={`response-status${result.status >= 200 && result.status < 300 ? " is-success" : " is-error"}`}>{result.status}</span>}
              </div>
              {result ? (
                <>
                  <div className="response-meta"><span>{result.durationMs} ms</span>{result.paid && <strong>Payment settled</strong>}</div>
                  <pre className="response-json"><code>{prettyJson(result.body)}</code></pre>
                </>
              ) : (
                <div className="response-empty">
                  <span className="response-glyph" aria-hidden="true">&#123; &#125;</span>
                  <strong>Your response will appear here</strong>
                  <p>Choose an operation, review the JSON body and approve a single paid request.</p>
                </div>
              )}
            </section>
          </div>

          <div className="security-note"><span aria-hidden="true">i</span><p>Only the eight listed routes are proxied. Your wallet signs payment locally; no private key is sent to this app.</p></div>
          </> : activeTool === "chat" ? <ThirdwebChat accountAddress={account?.address} /> : <AssetTools mode={activeTool} />}
        </main>
      </div>
    </div>
  );
}
