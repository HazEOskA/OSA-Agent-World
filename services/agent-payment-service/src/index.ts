import type { WalletPolicy } from "@osa/domain";
import type { MarketListing } from "@osa/market-core";
import { evaluateWalletPolicy } from "@osa/wallet-policy";

export interface AgentPaymentIntent {
  intentId:string;
  buyerAgentId:string;
  listingId:string;
  sellerId:string;
  asset:string;
  amount:string;
  operation:"pay_approved_service";
  destination:"approved_service";
}

export interface AgentPaymentDecision {
  intent:AgentPaymentIntent;
  decision:"ALLOW"|"DENY"|"APPROVAL_REQUIRED";
  reasons:readonly string[];
}

export function createAgentPaymentIntent(
  buyerAgentId:string,
  listing:MarketListing
):AgentPaymentIntent {
  return {
    intentId:`pay_${buyerAgentId}_${listing.listingId}`,
    buyerAgentId,
    listingId:listing.listingId,
    sellerId:listing.sellerId,
    asset:listing.priceAsset,
    amount:listing.priceAmount,
    operation:"pay_approved_service",
    destination:"approved_service"
  };
}

export function authorizeAgentPayment(
  policy:WalletPolicy,
  intent:AgentPaymentIntent,
  spentToday="0"
):AgentPaymentDecision {
  const result=evaluateWalletPolicy(policy,{
    operation:intent.operation,
    asset:intent.asset,
    amount:intent.amount,
    destination:intent.destination,
    spentToday
  });
  return {intent,decision:result.decision,reasons:result.reasons};
}
