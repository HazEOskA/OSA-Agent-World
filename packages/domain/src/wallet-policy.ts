import type { PolicyId } from "./ids.js";

export type PolicyDecision = "ALLOW" | "DENY" | "APPROVAL_REQUIRED";

export interface WalletPolicy {
  policyId: PolicyId;
  allowedAssets: readonly string[];
  maxSingleTransaction: string;
  dailyLimit: string;
  allowedDestinations: readonly string[];
  allowedOperations: readonly string[];
  humanApprovalThreshold: string | null;
}
