import { describe, expect, it } from "vitest";
import { KAI_WALLET_POLICY, evaluateWalletPolicy } from "./index.js";

describe("wallet policy", () => {
  it("allows a small approved service payment", () => {
    expect(
      evaluateWalletPolicy(KAI_WALLET_POLICY, {
        operation: "pay_approved_service",
        asset: "OSA_USDC_TEST",
        amount: "2",
        destination: "approved_service",
        spentToday: "1"
      }).decision
    ).toBe("ALLOW");
  });

  it("requires human approval at threshold", () => {
    expect(
      evaluateWalletPolicy(KAI_WALLET_POLICY, {
        operation: "pay_approved_service",
        asset: "OSA_USDC_TEST",
        amount: "5",
        destination: "approved_service",
        spentToday: "0"
      }).decision
    ).toBe("APPROVAL_REQUIRED");
  });

  it("denies unknown destination", () => {
    const result = evaluateWalletPolicy(KAI_WALLET_POLICY, {
      operation: "pay_approved_service",
      asset: "OSA_USDC_TEST",
      amount: "1",
      destination: "unknown_contract",
      spentToday: "0"
    });
    expect(result.decision).toBe("DENY");
    expect(result.reasons).toContain("DESTINATION_DENIED");
  });
});
