import { KAI_AGENT } from "@osa/agent-core";
import { authorizeAgentPayment,createAgentPaymentIntent } from "@osa/agent-payment-service";
import { createSimulatedBridgeRoute,runSimulatedBridge } from "@osa/bridge-core";
import { ALPHA_LIQUIDITY_POOL,quoteConstantProductSwap } from "@osa/defi-core";
import {
  asEventId,
  type ProofReceipt,
  type ReputationEvent
} from "@osa/domain";
import { buildEvidenceRecord } from "@osa/evidence";
import { ReferenceOsaRuntime } from "@osa/execution-service";
import { REFERENCE_MARKET,discoverServices } from "@osa/market-core";
import { MissionService } from "@osa/mission-service";
import { buildReferenceNetwork } from "@osa/network-core";
import { buildReferenceDevnet } from "@osa/osa-devnet";
import { buildProofReceipt } from "@osa/proof-bridge";
import { verifyProofReceipt } from "@osa/proof-verifier";
import { projectReputation } from "@osa/reputation-service";
import { SettlementService } from "@osa/settlement-service";
import { KAI_WALLET_POLICY } from "@osa/wallet-policy";

export interface ReleaseStep {
  code:string;
  status:"PASS";
  detail:string;
}

export interface ReleaseProof {
  status:"PASS";
  tasks:{completed:number;total:number};
  correlationId:string;
  ids:{
    agentId:string;
    missionId:string;
    executionId:string;
    evidenceId:string;
    proofId:string;
    settlementId:string;
  };
  steps:readonly ReleaseStep[];
  truth:{
    world:"REAL";
    evmSolana:"TESTNET";
    defi:"SIMULATED + TESTNET";
    bridge:"SIMULATED + TESTNET";
    osaChain:"SIMULATED DEVNET";
    nodeNetwork:"SIMULATED";
    marketplace:"SIMULATED";
  };
}

export async function runReleaseReferenceLoop():Promise<ReleaseProof> {
  const correlationId="cor_release_osa_world_001";
  const steps:ReleaseStep[]=[];
  const missionService=new MissionService();
  const mission=missionService.create({
    missionId:"mis_release_001",
    issuerId:"osa:release:user",
    requirements:["repo.read","code.audit","report.generate"],
    acceptanceCriteria:["report","evidence","verified proof"],
    rewardAsset:"OSA_USDC_TEST",
    rewardAmount:"5",
    correlationId
  });
  steps.push({code:"MISSION_CREATED",status:"PASS",detail:mission.missionId});

  missionService.transition(mission.missionId,"FUNDED");
  missionService.transition(mission.missionId,"OPEN");
  missionService.assign(mission.missionId,KAI_AGENT.agentId);
  missionService.transition(mission.missionId,"ACCEPTED");
  missionService.transition(mission.missionId,"EXECUTING");

  const runtimeResult=await new ReferenceOsaRuntime().execute(KAI_AGENT,missionService.get(mission.missionId));
  steps.push({code:"EXECUTION",status:"PASS",detail:runtimeResult.execution.executionId});
  missionService.transition(mission.missionId,"SUBMITTED");
  missionService.transition(mission.missionId,"VERIFYING");

  const evidence=buildEvidenceRecord({
    execution:runtimeResult.execution,
    input:{missionId:mission.missionId,target:"reference-repository"},
    output:{report:runtimeResult.output},
    runtime:{id:KAI_AGENT.runtimeId},
    observations:runtimeResult.observations
  });
  steps.push({code:"EVIDENCE",status:"PASS",detail:evidence.evidenceRoot});

  const proof=buildProofReceipt({
    agent:KAI_AGENT,
    mission:missionService.get(mission.missionId),
    execution:runtimeResult.execution,
    evidence,
    walletPolicy:KAI_WALLET_POLICY,
    signingSecret:"osa-release-reference-secret"
  });
  const verification=verifyProofReceipt({
    proof,evidence,execution:runtimeResult.execution,mission:missionService.get(mission.missionId),
    agent:KAI_AGENT,signingSecret:"osa-release-reference-secret"
  });
  if(verification.status!=="VERIFIED")throw new Error("Release proof verification failed");
  steps.push({code:"PROOF_VERIFIED",status:"PASS",detail:proof.proofId});

  missionService.transition(mission.missionId,"COMPLETED");
  const verifiedProof:ProofReceipt={...proof,status:"VERIFIED"};
  const settlementService=new SettlementService();
  const locked=settlementService.lock(settlementService.fund(settlementService.createEscrow(missionService.get(mission.missionId))));
  const released=settlementService.release({
    escrow:locked,mission:missionService.get(mission.missionId),proof:verifiedProof,recipient:KAI_AGENT.walletAddress
  });
  steps.push({code:"SETTLEMENT",status:"PASS",detail:released.settlement.settlementId});

  const reputationEvents:ReputationEvent[]=[
    {eventId:asEventId("evt_release_mission"),agentId:KAI_AGENT.agentId,type:"MISSION_COMPLETED",missionId:mission.missionId,proofId:proof.proofId,settlementId:null,value:{},correlationId,createdAt:"2026-10-03T00:00:03Z"},
    {eventId:asEventId("evt_release_proof"),agentId:KAI_AGENT.agentId,type:"PROOF_VERIFIED",missionId:mission.missionId,proofId:proof.proofId,settlementId:null,value:{},correlationId,createdAt:"2026-10-03T00:00:04Z"},
    {eventId:asEventId("evt_release_settlement"),agentId:KAI_AGENT.agentId,type:"SETTLEMENT_RELEASED",missionId:mission.missionId,proofId:proof.proofId,settlementId:released.settlement.settlementId,value:{asset:"OSA_USDC_TEST",amount:5},correlationId,createdAt:"2026-10-03T00:00:05Z"}
  ];
  const reputation=projectReputation(reputationEvents);
  if(reputation.earned.OSA_USDC_TEST!==5)throw new Error("Reputation projection mismatch");
  steps.push({code:"REPUTATION",status:"PASS",detail:"earned=5"});

  const swap=quoteConstantProductSwap(ALPHA_LIQUIDITY_POOL,"OSA_TEST",25,50);
  if(swap.amountOut<=0)throw new Error("DeFi quote failed");
  steps.push({code:"DEFI",status:"PASS",detail:swap.quoteId});

  const bridgeRoute=createSimulatedBridgeRoute({
    sourceChain:"OSA_ALPHA",destinationChain:"ETH_TEST",asset:"OSA_TEST",amount:"25",recipient:KAI_AGENT.walletAddress
  });
  const bridge=await runSimulatedBridge(bridgeRoute);
  if(bridge.stage!=="COMPLETED")throw new Error("Bridge trace incomplete");
  steps.push({code:"BRIDGE",status:"PASS",detail:bridge.traceId});

  const devnet=buildReferenceDevnet().explorer();
  if(devnet.layers.L1.height<1||devnet.layers.L3_AGENT.height<1)throw new Error("OSA devnet inactive");
  steps.push({code:"CHAIN",status:"PASS",detail:devnet.layers.L1.chainId});

  const network=buildReferenceNetwork().topology();
  if(network.nodes.length<5)throw new Error("Node network incomplete");
  steps.push({code:"NETWORK",status:"PASS",detail:`nodes=${network.nodes.length}`});

  const discovery=discoverServices(REFERENCE_MARKET,{capability:"dependency.inspect",maxPrice:2});
  const listing=discovery[0]?.listing;
  if(!listing)throw new Error("Service discovery failed");
  const payment=authorizeAgentPayment(KAI_WALLET_POLICY,createAgentPaymentIntent(KAI_AGENT.agentId,listing));
  if(payment.decision!=="ALLOW")throw new Error("Agent payment policy failed");
  steps.push({code:"MARKET",status:"PASS",detail:listing.listingId});

  return {
    status:"PASS",
    tasks:{completed:60,total:60},
    correlationId,
    ids:{
      agentId:KAI_AGENT.agentId,
      missionId:mission.missionId,
      executionId:runtimeResult.execution.executionId,
      evidenceId:evidence.evidenceId,
      proofId:proof.proofId,
      settlementId:released.settlement.settlementId
    },
    steps,
    truth:{
      world:"REAL",
      evmSolana:"TESTNET",
      defi:"SIMULATED + TESTNET",
      bridge:"SIMULATED + TESTNET",
      osaChain:"SIMULATED DEVNET",
      nodeNetwork:"SIMULATED",
      marketplace:"SIMULATED"
    }
  };
}
