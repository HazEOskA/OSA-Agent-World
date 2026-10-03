export type DistrictId = "nexus" | "agents" | "defi" | "bridge" | "proof" | "chain" | "nodes";

export interface DistrictDefinition {
  id: DistrictId;
  code: string;
  title: string;
  eyebrow: string;
  description: string;
  status: "CORE" | "SIMULATED";
  metric: string;
}

export const districts: readonly DistrictDefinition[] = [
  { id:"nexus",code:"00",title:"CENTRAL NEXUS",eyebrow:"WORLD CORE",description:"The spatial command layer connecting every protocol district.",status:"CORE",metric:"WORLD ONLINE" },
  { id:"agents",code:"01",title:"AGENT DISTRICT",eyebrow:"AUTONOMOUS ECONOMY",description:"Identity, missions, wallets, policy and verifiable agent execution.",status:"CORE",metric:"KAI RUNTIME LIVE" },
  { id:"defi",code:"02",title:"DEFI DISTRICT",eyebrow:"LIQUIDITY ENGINE",description:"Swap, liquidity, lending, staking and vault primitives enter here.",status:"SIMULATED",metric:"SIM + TESTNET" },
  { id:"bridge",code:"03",title:"BRIDGE TOWER",eyebrow:"CROSS-CHAIN PORTAL",description:"A chain-agnostic teleport layer for assets, messages and agent identity.",status:"SIMULATED",metric:"WTT TESTNET READY" },
  { id:"proof",code:"04",title:"PROOF LAB",eyebrow:"CLAIM ≠ PROOF",description:"Execution evidence, digests and verification become inspectable protocol objects.",status:"CORE",metric:"VERIFY + TAMPER" },
  { id:"chain",code:"05",title:"CHAIN CORE",eyebrow:"L1 / L2 / L3 DEVNET",description:"Genesis, block production and settlement anchors across the OSA execution stack.",status:"SIMULATED",metric:"OSA DEVNET LIVE" },
  { id:"nodes",code:"06",title:"NODE GRID",eyebrow:"NETWORK MESH",description:"Validators, sequencer, RPC, indexer, relayer, proof and agent nodes operating as one topology.",status:"SIMULATED",metric:"9 NODES ONLINE" }
] as const;

export type WorldEventType =
  | "world.booted"
  | "district.teleport.started"
  | "district.teleport.completed"
  | "identity.wallet.connected"
  | "identity.wallet.disconnected"
  | "transaction.signature.requested"
  | "transaction.submitted"
  | "transaction.confirmed"
  | "transaction.failed"
  | "defi.quote.created"
  | "defi.swap.submitted"
  | "defi.swap.confirmed"
  | "defi.swap.failed"
  | "defi.liquidity.position.created"
  | "bridge.route.created"
  | "bridge.transfer.started"
  | "bridge.transfer.completed"
  | "bridge.transfer.failed"
  | "agent.execution.started"
  | "agent.execution.completed"
  | "agent.execution.failed"
  | "proof.verification.started"
  | "proof.verified"
  | "proof.failed"
  | "settlement.released"
  | "reputation.updated"
  | "chain.snapshot.loaded"
  | "network.snapshot.loaded";

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  district: DistrictId;
  label: string;
  mode: "REAL" | "TESTNET" | "SIMULATED";
}

export interface WorldState {
  activeDistrict: DistrictId;
  teleporting: boolean;
  lastEvent: WorldEvent;
}

export const initialWorldEvent: WorldEvent = {id:"w_evt_0001",type:"world.booted",district:"nexus",label:"WORLD SHELL ONLINE",mode:"REAL"};

export function reduceWorldState(state:WorldState,event:WorldEvent):WorldState {
  const isTeleport=event.type==="district.teleport.started"||event.type==="district.teleport.completed";
  return {activeDistrict:isTeleport?event.district:state.activeDistrict,teleporting:event.type==="district.teleport.started",lastEvent:event};
}

export function districtById(id:DistrictId):DistrictDefinition {
  const district=districts.find(candidate=>candidate.id===id);
  if(!district)throw new Error(`Unknown district: ${id}`);
  return district;
}
