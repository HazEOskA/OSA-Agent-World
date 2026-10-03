import type { OsaBlock, OsaLayer } from "@osa/osa-chain-core";

export type OsaNodeType =
  | "VALIDATOR"
  | "SEQUENCER"
  | "RPC"
  | "INDEXER"
  | "RELAYER"
  | "PROOF"
  | "AGENT";

export type OsaNodeStatus = "ONLINE" | "DEGRADED" | "OFFLINE";

export interface OsaNode {
  nodeId: string;
  type: OsaNodeType;
  layer: OsaLayer | "GLOBAL";
  endpoint: string | null;
  status: OsaNodeStatus;
  latencyMs: number;
  mode: "SIMULATED";
  lastHeartbeat: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  channel: "RPC" | "BLOCKS" | "ATTESTATION" | "INDEX" | "EXECUTION";
}

export class NodeRegistry {
  #nodes = new Map<string,OsaNode>();
  #edges: NetworkEdge[] = [];

  register(node: OsaNode): OsaNode {
    if(this.#nodes.has(node.nodeId)) throw new Error("Node already registered");
    this.#nodes.set(node.nodeId,node);
    return node;
  }

  heartbeat(nodeId:string,status:OsaNodeStatus,latencyMs:number,at=new Date().toISOString()): OsaNode {
    const node=this.#nodes.get(nodeId);
    if(!node) throw new Error("Node not found");
    const next={...node,status,latencyMs,lastHeartbeat:at};
    this.#nodes.set(nodeId,next);
    return next;
  }

  connect(edge:NetworkEdge): void {
    if(!this.#nodes.has(edge.from)||!this.#nodes.has(edge.to)) throw new Error("Unknown topology node");
    if(!this.#edges.some(current=>current.from===edge.from&&current.to===edge.to&&current.channel===edge.channel)){
      this.#edges.push(edge);
    }
  }

  list(): readonly OsaNode[] {
    return [...this.#nodes.values()];
  }

  topology(): {nodes:readonly OsaNode[];edges:readonly NetworkEdge[]} {
    return {nodes:this.list(),edges:[...this.#edges]};
  }
}

export interface FinalityResult {
  blockHash: string;
  validators: number;
  approvals: number;
  required: number;
  finalized: boolean;
}

export function simulateFinality(block: OsaBlock, validatorVotes: readonly boolean[]): FinalityResult {
  if(validatorVotes.length===0) throw new Error("Validator set cannot be empty");
  const approvals=validatorVotes.filter(Boolean).length;
  const required=Math.floor((validatorVotes.length*2)/3)+1;
  return {
    blockHash:block.blockHash,
    validators:validatorVotes.length,
    approvals,
    required,
    finalized:approvals>=required
  };
}

export function buildReferenceNetwork(at="2026-10-03T00:00:00.000Z"): NodeRegistry {
  const registry=new NodeRegistry();
  const nodes: OsaNode[]=[
    {nodeId:"node_val_l1_01",type:"VALIDATOR",layer:"L1",endpoint:null,status:"ONLINE",latencyMs:18,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_val_l1_02",type:"VALIDATOR",layer:"L1",endpoint:null,status:"ONLINE",latencyMs:21,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_val_l1_03",type:"VALIDATOR",layer:"L1",endpoint:null,status:"ONLINE",latencyMs:19,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_seq_l2_01",type:"SEQUENCER",layer:"L2",endpoint:null,status:"ONLINE",latencyMs:11,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_rpc_01",type:"RPC",layer:"GLOBAL",endpoint:"/api/osa-rpc",status:"ONLINE",latencyMs:9,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_indexer_01",type:"INDEXER",layer:"GLOBAL",endpoint:null,status:"ONLINE",latencyMs:16,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_relayer_01",type:"RELAYER",layer:"GLOBAL",endpoint:null,status:"ONLINE",latencyMs:24,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_proof_01",type:"PROOF",layer:"GLOBAL",endpoint:null,status:"ONLINE",latencyMs:14,mode:"SIMULATED",lastHeartbeat:at},
    {nodeId:"node_agent_kai",type:"AGENT",layer:"L3_AGENT",endpoint:null,status:"ONLINE",latencyMs:7,mode:"SIMULATED",lastHeartbeat:at}
  ];
  for(const node of nodes) registry.register(node);
  registry.connect({from:"node_seq_l2_01",to:"node_val_l1_01",channel:"BLOCKS"});
  registry.connect({from:"node_rpc_01",to:"node_indexer_01",channel:"INDEX"});
  registry.connect({from:"node_relayer_01",to:"node_seq_l2_01",channel:"ATTESTATION"});
  registry.connect({from:"node_agent_kai",to:"node_proof_01",channel:"EXECUTION"});
  registry.connect({from:"node_rpc_01",to:"node_seq_l2_01",channel:"RPC"});
  return registry;
}
