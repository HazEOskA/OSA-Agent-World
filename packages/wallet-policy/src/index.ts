import {
  asPolicyId,
  type PolicyDecision,
  type WalletPolicy
} from "@osa/domain";

export interface WalletPolicyIntent {
  operation: string;
  asset: string;
  amount: string;
  destination: string;
  spentToday: string;
}

export interface WalletPolicyResult {
  decision: PolicyDecision;
  reasons: readonly string[];
}

export const KAI_WALLET_POLICY: WalletPolicy = {
  policyId: asPolicyId("pol_kai_guarded_001"),
  allowedAssets: ["OSA_USDC_TEST", "USDC_TEST"],
  maxSingleTransaction: "5",
  dailyLimit: "10",
  allowedDestinations: ["mission_escrow", "approved_service"],
  allowedOperations: ["receive_reward", "pay_approved_service"],
  humanApprovalThreshold: "5"
};

function asScaled(value: string): bigint {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  if (!/^\d+$/.test(whole) || (fraction && !/^\d+$/.test(fraction))) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }
  const normalizedFraction = fraction.padEnd(6, "0").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(normalizedFraction || "0");
}

export function evaluateWalletPolicy(
  policy: WalletPolicy,
  intent: WalletPolicyIntent
): WalletPolicyResult {
  const reasons: string[] = [];
  if (!policy.allowedAssets.includes(intent.asset)) reasons.push("ASSET_DENIED");
  if (!policy.allowedOperations.includes(intent.operation)) reasons.push("OPERATION_DENIED");
  if (!policy.allowedDestinations.includes(intent.destination)) reasons.push("DESTINATION_DENIED");

  const amount = asScaled(intent.amount);
  const spentToday = asScaled(intent.spentToday);
  const maxSingle = asScaled(policy.maxSingleTransaction);
  const dailyLimit = asScaled(policy.dailyLimit);

  if (amount > maxSingle) reasons.push("SINGLE_TX_LIMIT_EXCEEDED");
  if (spentToday + amount > dailyLimit) reasons.push("DAILY_LIMIT_EXCEEDED");

  if (reasons.length > 0) return { decision: "DENY", reasons };

  if (
    policy.humanApprovalThreshold !== null &&
    amount >= asScaled(policy.humanApprovalThreshold)
  ) {
    return { decision: "APPROVAL_REQUIRED", reasons: ["HUMAN_THRESHOLD"] };
  }

  return { decision: "ALLOW", reasons: [] };
}
