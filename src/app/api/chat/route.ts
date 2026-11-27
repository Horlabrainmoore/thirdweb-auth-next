import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createThirdwebAI } from "@thirdweb-dev/ai-sdk-provider";
import { NextResponse } from "next/server";
import { supportedEvmChainIds } from "../../../lib/evm-chains";

export const runtime = "nodejs";
export const maxDuration = 300;

const thirdwebAI = createThirdwebAI({
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});
const maxRequestBytes = 128 * 1024;
const walletAddressPattern = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  if (!process.env.THIRDWEB_SECRET_KEY) {
    return NextResponse.json({ error: "Thirdweb AI is not configured on the server." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxRequestBytes) {
    return NextResponse.json({ error: "The chat request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const input = payload as { id?: unknown; messages?: unknown; from?: unknown; chainId?: unknown };
  if (typeof input.id !== "string" || input.id.length < 1 || input.id.length > 128) {
    return NextResponse.json({ error: "A valid chat ID is required." }, { status: 400 });
  }
  if (!Array.isArray(input.messages) || input.messages.length < 1 || input.messages.length > 40) {
    return NextResponse.json({ error: "Send between 1 and 40 chat messages." }, { status: 400 });
  }
  if (typeof input.chainId !== "number" || !supportedEvmChainIds.some((chainId) => chainId === input.chainId)) {
    return NextResponse.json({ error: "Select a supported network before sending a message." }, { status: 400 });
  }

  const from = typeof input.from === "string" && walletAddressPattern.test(input.from)
    ? input.from
    : undefined;
  const availableTools = thirdwebAI.tools();
  const chatTools = {
    sign_transaction: availableTools.sign_transaction,
    sign_swap: availableTools.sign_swap,
  };

  try {
    const result = streamText({
      model: thirdwebAI.chat(input.id, {
        context: {
          chain_ids: [input.chainId],
          from,
          auto_execute_transactions: false,
        },
      }),
      messages: convertToModelMessages(input.messages as UIMessage[], { tools: chatTools }),
      tools: chatTools,
    });

    return result.toUIMessageStreamResponse({ sendReasoning: true });
  } catch {
    return NextResponse.json({ error: "The assistant could not start this response. Please try again." }, { status: 500 });
  }
}
