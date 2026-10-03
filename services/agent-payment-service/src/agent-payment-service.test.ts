import { describe,expect,it } from "vitest";
import { KAI_AGENT } from "@osa/agent-core";
import { REFERENCE_MARKET } from "@osa/market-core";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";
import { authorizeAgentPayment,createAgentPaymentIntent } from "./index.js";

describe("agent payments",()=>{
  it("allows KAI to buy the dependency skill",()=>{
    const listing=REFERENCE_MARKET.find(item=>item.listingId==="lst_skill_dep");
    if(!listing)throw new Error("Missing listing");
    const decision=authorizeAgentPayment(KAI_WALLET_POLICY,createAgentPaymentIntent(KAI_AGENT.agentId,listing));
    expect(decision.decision).toBe("ALLOW");
  });

  it("requires approval at the five-unit threshold",()=>{
    const listing=REFERENCE_MARKET.find(item=>item.listingId==="lst_agent_kai");
    if(!listing)throw new Error("Missing listing");
    const decision=authorizeAgentPayment(KAI_WALLET_POLICY,createAgentPaymentIntent(KAI_AGENT.agentId,listing));
    expect(decision.decision).toBe("APPROVAL_REQUIRED");
  });
});
