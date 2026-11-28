"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import type { SignTransactionInput, ThirdwebAiMessage } from "@thirdweb-dev/ai-sdk-provider";
import { prepareTransaction, sendTransaction } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../../../lib/client";
import { getSupportedEvmChain, getSupportedEvmChainName, supportedEvmChains, type SupportedEvmChainId } from "../../../lib/evm-chains";

type AddToolResult = UseChatHelpers<ThirdwebAiMessage>["addToolResult"];
type TransactionRequest = Pick<SignTransactionInput, "chain_id" | "to" | "value" | "data">;

function TransactionApproval({
  input,
  toolCallId,
  tool,
  selectedChainId,
  addToolResult,
}: {
  input: TransactionRequest;
  toolCallId: string;
  tool: "sign_transaction" | "sign_swap";
  selectedChainId: SupportedEvmChainId;
  addToolResult: AddToolResult;
}) {
  const account = useActiveAccount();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const approve = async () => {
    if (!account) {
      setError("Connect a wallet before approving this transaction.");
      return;
    }

    const chain = getSupportedEvmChain(input.chain_id);
    if (!chain || input.chain_id !== selectedChainId) {
      setError("This transaction does not match the selected supported network. Ask the assistant to prepare it again for the selected network.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const transaction = prepareTransaction({
        client,
        chain,
        to: input.to as `0x${string}`,
        value: BigInt(input.value),
        data: input.data as `0x${string}`,
      });
      const result = await sendTransaction({ account, transaction });
      await addToolResult({
        tool,
        toolCallId,
        output: {
          transaction_hash: result.transactionHash,
          chain_id: input.chain_id,
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The wallet could not submit this transaction.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="ai-transaction-card" aria-label="Transaction approval request">
      <div className="ai-transaction-card-header">
        <span className="ai-tool-tag">WALLET ACTION</span>
        <span className="ai-chain-tag">{getSupportedEvmChainName(input.chain_id)} · {input.chain_id}</span>
      </div>
      <p className="ai-transaction-note">Review the chain, destination, value, and calldata. Nothing is signed or sent until you approve it in your wallet. Tempo-specific stablecoin fee selection depends on wallet support.</p>
      <dl className="ai-transaction-details">
        <div><dt>To</dt><dd>{input.to}</dd></div>
        <div><dt>Value</dt><dd>{input.value} wei</dd></div>
        <div><dt>Data</dt><dd>{input.data || "0x"}</dd></div>
      </dl>
      {error && <p className="ai-chat-error" role="alert">{error}</p>}
      <button className="ai-approve-button" type="button" onClick={approve} disabled={pending || !account}>
        {pending ? "Waiting for wallet…" : account ? "Review and approve in wallet" : "Connect wallet to approve"}
      </button>
    </section>
  );
}

function renderToolPart(part: ThirdwebAiMessage["parts"][number], addToolResult: AddToolResult, selectedChainId: SupportedEvmChainId) {
  if (part.type === "tool-sign_transaction" && part.state === "input-available" && part.input) {
    return <TransactionApproval key={part.toolCallId} input={part.input} toolCallId={part.toolCallId} tool="sign_transaction" selectedChainId={selectedChainId} addToolResult={addToolResult} />;
  }
  if (part.type === "tool-sign_swap" && part.state === "input-available" && part.input) {
    return <TransactionApproval key={part.toolCallId} input={part.input.transaction} toolCallId={part.toolCallId} tool="sign_swap" selectedChainId={selectedChainId} addToolResult={addToolResult} />;
  }
  return null;
}

export function ThirdwebChat({ accountAddress }: { accountAddress?: string }) {
  const [draft, setDraft] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<SupportedEvmChainId>(8453);
  const selectedChain = getSupportedEvmChain(selectedChainId)!;
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { from: accountAddress, chainId: selectedChainId } }),
    [accountAddress, selectedChainId],
  );
  const { messages, sendMessage, addToolResult, status, error, stop, setMessages } = useChat<ThirdwebAiMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  const isWorking = status === "submitted" || status === "streaming";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isWorking) return;
    setDraft("");
    void sendMessage({ text });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const changeNetwork = (event: ChangeEvent<HTMLSelectElement>) => {
    const chainId = Number(event.target.value);
    if (isWorking || !getSupportedEvmChain(chainId)) return;
    setSelectedChainId(chainId as SupportedEvmChainId);
    setMessages([]);
  };

  const sendSuggestion = (text: string) => {
    if (isWorking) return;
    void sendMessage({ text });
  };

  return (
    <section className="ai-chat-page" aria-labelledby="ai-chat-title">
      <header className="ai-chat-heading">
        <div>
          <div className="breadcrumbs"><span>Thirdweb</span><span>/</span><strong>AI Assistant</strong></div>
          <h2 id="ai-chat-title">Talk to your onchain assistant</h2>
          <p>Ask questions about blockchain activity, tokens, or transactions. Wallet actions always require your approval.</p>
        </div>
        <span className="version-tag"><span className="version-dot" /> {selectedChain.name} · Chain {selectedChain.id}</span>
      </header>

      <div className="ai-chat-surface">
        <div className="ai-chat-toolbar">
          <div className="ai-chat-presence"><span className="ai-chat-presence-dot" /><div><strong>thirdweb AI</strong><span>Wallet-aware · approvals stay with you</span></div></div>
          <div className="ai-chat-network-controls">
            <label htmlFor="ai-chat-network">Network</label>
            <select id="ai-chat-network" value={selectedChainId} onChange={changeNetwork} disabled={isWorking}>
              {supportedEvmChains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}</option>)}
            </select>
          </div>
          <span className="ai-chat-session">{accountAddress ? `${accountAddress.slice(0, 6)}…${accountAddress.slice(-4)}` : "Wallet not connected"}</span>
        </div>
        {(selectedChainId === 4217 || selectedChainId === 42431) && (
          <p className="ai-chat-network-note">Tempo uses USD stablecoins for fees rather than a native gas token. This chat does not choose a TIP-20 fee token or build Tempo Transaction envelopes; fee handling depends on your wallet.</p>
        )}

        <div className="ai-message-list" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="ai-chat-welcome">
              <span className="ai-chat-monogram" aria-hidden="true">AI</span>
              <h3>What would you like to explore?</h3>
              <p>Start with a question, or try one of these prompts.</p>
              <div className="ai-suggestions">
                <button type="button" onClick={() => sendSuggestion("What can you help me do with my wallet?")}>What can you help me do?</button>
                <button type="button" onClick={() => sendSuggestion("Explain how a token swap works across chains.")}>Explain a cross-chain swap</button>
                <button type="button" onClick={() => sendSuggestion("How do I check a transaction on Base?")}>Check a Base transaction</button>
              </div>
            </div>
          ) : messages.map((message) => (
            <article className={`ai-message ai-message-${message.role}`} key={message.id}>
              <div className="ai-message-role">{message.role === "user" ? "YOU" : "THIRDWEB AI"}</div>
              <div className="ai-message-content">
                {message.parts.map((part, index) => {
                  if (part.type === "text" && part.text) return <p key={`${message.id}-${index}`}>{part.text}</p>;
                  if (part.type === "reasoning" && part.text) return <details className="ai-reasoning" key={`${message.id}-${index}`}><summary>Reasoning</summary><p>{part.text}</p></details>;
                  return renderToolPart(part, addToolResult, selectedChainId);
                })}
              </div>
            </article>
          ))}
          {isWorking && <p className="ai-thinking" role="status"><span /> {status === "submitted" ? "Thinking…" : "Writing response…"}</p>}
          {error && <p className="ai-chat-error" role="alert">{error.message}</p>}
        </div>

        <form className="ai-chat-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="ai-chat-input">Message the thirdweb AI assistant</label>
          <textarea
            id="ai-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about tokens, chains, or wallet actions…"
            rows={2}
            disabled={isWorking}
          />
          <div className="ai-composer-footer">
            <span>Enter to send · Shift + Enter for a new line</span>
            {isWorking ? (
              <button type="button" className="ai-send-button ai-stop-button" onClick={stop}>Stop</button>
            ) : (
              <button type="submit" className="ai-send-button" disabled={!draft.trim()}>Send <span aria-hidden="true">↗</span></button>
            )}
          </div>
        </form>
      </div>
      <p className="ai-chat-disclaimer">AI responses may be inaccurate. Verify the network, recipient, value, and calldata in your wallet before signing.</p>
    </section>
  );
}
