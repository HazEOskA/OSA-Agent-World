import { NextResponse } from "next/server";
import { KAI_AGENT } from "@osa/agent-core";
import { REFERENCE_MARKET, discoverServices } from "@osa/market-core";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";
import { authorizeAgentPayment, createAgentPaymentIntent } from "@osa/agent-payment-service";

export async function GET() {
  const discovery=discoverServices(REFERENCE_MARKET,{capability:"dependency.inspect",maxPrice:2});
  const selected=discovery[0]?.listing ?? null;
  const payment=selected
    ? authorizeAgentPayment(KAI_WALLET_POLICY,createAgentPaymentIntent(KAI_AGENT.agentId,selected))
    : null;

  return NextResponse.json({
    mode:"SIMULATED",
    listings:REFERENCE_MARKET,
    discovery,
    payment,
    truth:"MARKETPLACE AND POLICY DECISIONS ARE EXECUTABLE; ECONOMIC SETTLEMENT REMAINS TEST/SIMULATED"
  });
}
