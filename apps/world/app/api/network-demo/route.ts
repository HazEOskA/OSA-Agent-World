import { NextResponse } from "next/server";
import { buildReferenceDevnet } from "@osa/osa-devnet";
import { buildReferenceNetwork, simulateFinality } from "@osa/network-core";
import { handleOsaRpc } from "@osa/rpc-service";
import { indexSnapshot } from "@osa/indexer";
import { OsaRelayer } from "@osa/relayer";

export async function GET() {
  const devnet=buildReferenceDevnet();
  const snapshot=devnet.explorer();
  const registry=buildReferenceNetwork();
  const topology=registry.topology();
  const latestL1=snapshot.recentBlocks.find(block=>block.layer==="L1");
  const finality=latestL1 ? simulateFinality(latestL1,[true,true,true]) : null;
  const index=indexSnapshot(snapshot);
  const relayer=new OsaRelayer();
  const relay=relayer.relay({
    messageId:"msg_agent_proof_001",
    source:"L3_AGENT",
    destination:"L2",
    payloadDigest:"proof_demo_digest"
  });

  return NextResponse.json({
    mode:"SIMULATED",
    topology,
    finality,
    rpc:{
      chainId:handleOsaRpc(devnet,{jsonrpc:"2.0",id:1,method:"osa_chainId"}),
      blockNumber:handleOsaRpc(devnet,{jsonrpc:"2.0",id:2,method:"osa_blockNumber"})
    },
    index:{entities:index.length},
    relayer:relay,
    truth:"NETWORK SERVICES ARE EXECUTABLE SIMULATIONS; NO PUBLIC VALIDATOR SET YET"
  });
}
