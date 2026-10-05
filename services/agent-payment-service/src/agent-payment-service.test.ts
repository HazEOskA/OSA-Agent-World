import { describe,expect,it } from "vitest";
import { KAI_AGENT } from "@osa/agent-core";
import type { MarketListing } from "@osa/market-core";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";
import { authorizeAgentPayment,createAgentPaymentIntent } from "./index.js";

function listing(listingId:string,priceAmount:string):MarketListing {
  return {
    listingId,
    kind:"SKILL",
    sellerId:"osa:skills",
    title:"Registered service",
    capabilities:["dependency.inspect"],
    priceAsset:"OSA_USDC_TEST",
    priceAmount,
    reputation:90,
    endpoint:"https://agents.example.test/service",
    registeredAt:"2026-10-05T14:00:00.000Z",
    lastSeenAt:"2026-10-05T14:59:30.000Z",
    availability:"LIVE"
  };
}

describe("agent payments",()=>{
  it("allows KAI to buy a registered service below the approval threshold",()=>{
    const decision=authorizeAgentPayment(
      KAI_WALLET_POLICY,
      createAgentPaymentIntent(KAI_AGENT.agentId,listing("lst_skill_dep","1"))
    );
    expect(decision.decision).toBe("ALLOW");
  });

  it("requires approval at the five-unit threshold",()=>{
    const decision=authorizeAgentPayment(
      KAI_WALLET_POLICY,
      createAgentPaymentIntent(KAI_AGENT.agentId,listing("lst_agent_kai","5"))
    );
    expect(decision.decision).toBe("APPROVAL_REQUIRED");
  });
});
