export type DistrictId = "nexus" | "agents" | "defi" | "bridge" | "proof" | "chain" | "nodes" | "market";

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
  { id:"nexus",code:"00",title:"SYSTEM",eyebrow:"CONTROL PLANE",description:"Stan całego OSA Agent World: release proof, bezpieczeństwo, korelacja i gotowość systemu.",status:"CORE",metric:"SYSTEM ONLINE" },
  { id:"agents",code:"01",title:"AGENTY",eyebrow:"RUNTIME + MISJE",description:"Tożsamość, misje, możliwości, polityki, portfele i weryfikowalne wykonanie agentów.",status:"CORE",metric:"KAI RUNTIME LIVE" },
  { id:"defi",code:"02",title:"DEFI",eyebrow:"PŁYNNOŚĆ + SWAP",description:"Symulowane pule oraz testnetowe ścieżki wymiany i płynności powiązane z polityką wykonania.",status:"SIMULATED",metric:"SIM + TESTNET" },
  { id:"bridge",code:"03",title:"BRIDGE",eyebrow:"CROSS-CHAIN",description:"Trasy transferów pomiędzy sieciami, ślady wykonania i testnetowy Wormhole.",status:"SIMULATED",metric:"WTT TESTNET" },
  { id:"proof",code:"04",title:"DOWODY",eyebrow:"CLAIM ≠ PROOF",description:"Evidence, digesty, weryfikacja, tamper detection, settlement i reputacja w jednym przepływie.",status:"CORE",metric:"VERIFY + TAMPER" },
  { id:"chain",code:"05",title:"CHAIN",eyebrow:"L1 / L2 / L3",description:"Genesis, bloki, wysokość łańcucha i anchory rozliczeniowe w stosie OSA Devnet.",status:"SIMULATED",metric:"OSA DEVNET" },
  { id:"nodes",code:"06",title:"INFRA",eyebrow:"NETWORK MESH",description:"Walidatory, sequencer, RPC, indexer, relayer, proof node i agent nodes jako jedna topologia.",status:"SIMULATED",metric:"9 NODES ONLINE" },
  { id:"market",code:"07",title:"RYNEK",eyebrow:"AGENT ECONOMY",description:"Usługi, skille, API, compute i dane odkrywane oraz opłacane przez policy-bound intents.",status:"SIMULATED",metric:"5 SERVICES" }
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
  | "network.snapshot.loaded"
  | "market.snapshot.loaded"
  | "release.proof.loaded";

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

export const initialWorldEvent: WorldEvent = {id:"w_evt_0001",type:"world.booted",district:"nexus",label:"CONTROL PLANE ONLINE",mode:"REAL"};

export function reduceWorldState(state:WorldState,event:WorldEvent):WorldState {
  const isTeleport=event.type==="district.teleport.started"||event.type==="district.teleport.completed";
  return {activeDistrict:isTeleport?event.district:state.activeDistrict,teleporting:event.type==="district.teleport.started",lastEvent:event};
}

export function districtById(id:DistrictId):DistrictDefinition {
  const district=districts.find(candidate=>candidate.id===id);
  if(!district)throw new Error(`Unknown district: ${id}`);
  return district;
}
