"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { BuyWidget } from "thirdweb/react";
import { arbitrum } from "thirdweb/chains";
import { client } from "../../../lib/client";

export type OrderButtonProps = {
  /** Display label */
  label?: string;
  /** Amount in the chosen fiat currency (BuyWidget) */
  amount?: string;
  /** Fiat currency code */
  currency?: string;
  /** Optional product / order reference for your backend */
  orderRef?: string;
  className?: string;
};

/**
 * Reusable “order / buy” control that:
 * - Requires a connected thirdweb wallet
 * - Opens thirdweb BuyWidget for fiat → crypto
 * - Can be placed on any page next to catalog items
 */
export function OrderButton({
  label = "Buy with crypto",
  amount = "10",
  currency = "USD",
  orderRef,
  className = "",
}: OrderButtonProps) {
  const account = useActiveAccount();
  const [open, setOpen] = useState(false);

  if (!account) {
    return (
      <button type="button" className={`order-button order-button--disabled ${className}`} disabled>
        Connect wallet to order
      </button>
    );
  }

  return (
    <div className={`order-button-wrap ${className}`}>
      <button type="button" className="order-button" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide buy panel" : label}
        {orderRef && <span className="order-ref"> · {orderRef}</span>}
      </button>
      {open && (
        <div className="order-widget-surface">
          <BuyWidget client={client} currency={currency} chain={arbitrum} amount={amount} />
        </div>
      )}
    </div>
  );
}
