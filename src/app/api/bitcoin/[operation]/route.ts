import { NextResponse } from "next/server";
import { operations, validateOperationBody, type OperationId } from "../../../../lib/bitcoin-operations";

export const runtime = "nodejs";

const upstreamBase = "https://api.blockchain.info/explorer-gateway-kt";
const maxPayloadBytes = 64 * 1024;
const forwardedHeaders = ["content-type", "payment-required", "payment-response"];

function isOperationId(value: string): value is OperationId {
  return operations.some((operation) => operation.id === value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> },
) {
  const { operation } = await params;
  if (!isOperationId(operation)) {
    return NextResponse.json({ error: "Unknown Bitcoin operation." }, { status: 404 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maxPayloadBytes) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
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

  const input = payload as { body?: unknown; confirmedBroadcast?: unknown };
  const validationError = validateOperationBody(operation, input.body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  if (operation === "broadcast" && input.confirmedBroadcast !== true) {
    return NextResponse.json({ error: "Confirm the broadcast in the interface before sending." }, { status: 400 });
  }

  const selected = operations.find((item) => item.id === operation);
  if (!selected) return NextResponse.json({ error: "Unknown Bitcoin operation." }, { status: 404 });

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  const paymentSignature = request.headers.get("payment-signature");
  if (paymentSignature) headers.set("PAYMENT-SIGNATURE", paymentSignature);

  try {
    const upstream = await fetch(`${upstreamBase}${selected.path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(input.body),
      cache: "no-store",
    });

    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of forwardedHeaders) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "The Blockchain.com Explorer API could not be reached." }, { status: 502 });
  }
}
