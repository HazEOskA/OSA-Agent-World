import type { EscrowState } from "@osa/domain";

export type ChainTransactionStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface ChainTransactionReceipt {
  txId: string;
  status: ChainTransactionStatus;
}

export interface RegisterAgentInput {
  agentId: string;
  owner: string;
  wallet: string;
  identityDigest: string;
}

export interface CreateMissionEscrowInput {
  missionId: string;
  issuer: string;
  asset: string;
  amount: string;
}

export interface ProofAnchorInput {
  proofId: string;
  agentId: string;
  missionId: string;
  executionId: string;
  evidenceRoot: string;
  resultDigest: string;
  runtimeDigest: string;
  policyDigest: string;
}

export interface ReleaseRewardInput {
  missionId: string;
  settlementId: string;
  recipient: string;
}

export interface ChainAdapter {
  registerAgent(input: RegisterAgentInput): Promise<ChainTransactionReceipt>;
  createMissionEscrow(input: CreateMissionEscrowInput): Promise<ChainTransactionReceipt>;
  fundMission(missionId: string): Promise<ChainTransactionReceipt>;
  lockMission(missionId: string): Promise<ChainTransactionReceipt>;
  getEscrowState(missionId: string): Promise<EscrowState>;
  anchorProof(input: ProofAnchorInput): Promise<ChainTransactionReceipt>;
  releaseReward(input: ReleaseRewardInput): Promise<ChainTransactionReceipt>;
  refundReward(missionId: string): Promise<ChainTransactionReceipt>;
  getTransactionStatus(txId: string): Promise<ChainTransactionStatus>;
}

interface EscrowRecord extends CreateMissionEscrowInput {
  state: EscrowState;
}

export class InMemoryChainAdapter implements ChainAdapter {
  private readonly agents = new Map<string, RegisterAgentInput>();
  private readonly escrows = new Map<string, EscrowRecord>();
  private readonly proofs = new Map<string, ProofAnchorInput>();
  private readonly transactions = new Map<string, ChainTransactionStatus>();
  private txCounter = 0;

  private confirmedTx(): ChainTransactionReceipt {
    this.txCounter += 1;
    const txId = `mem_tx_${this.txCounter.toString().padStart(6, "0")}`;
    this.transactions.set(txId, "CONFIRMED");
    return { txId, status: "CONFIRMED" };
  }

  async registerAgent(input: RegisterAgentInput): Promise<ChainTransactionReceipt> {
    if (this.agents.has(input.agentId)) throw new Error("Agent already registered");
    this.agents.set(input.agentId, input);
    return this.confirmedTx();
  }

  async createMissionEscrow(input: CreateMissionEscrowInput): Promise<ChainTransactionReceipt> {
    if (this.escrows.has(input.missionId)) throw new Error("Escrow already exists");
    this.escrows.set(input.missionId, { ...input, state: "UNFUNDED" });
    return this.confirmedTx();
  }

  async fundMission(missionId: string): Promise<ChainTransactionReceipt> {
    const escrow = this.requireEscrow(missionId);
    if (escrow.state !== "UNFUNDED") throw new Error("Escrow cannot be funded from current state");
    escrow.state = "FUNDED";
    return this.confirmedTx();
  }

  async lockMission(missionId: string): Promise<ChainTransactionReceipt> {
    const escrow = this.requireEscrow(missionId);
    if (escrow.state !== "FUNDED") throw new Error("Escrow cannot be locked from current state");
    escrow.state = "LOCKED";
    return this.confirmedTx();
  }

  async getEscrowState(missionId: string): Promise<EscrowState> {
    return this.requireEscrow(missionId).state;
  }

  async anchorProof(input: ProofAnchorInput): Promise<ChainTransactionReceipt> {
    if (this.proofs.has(input.proofId)) throw new Error("Proof already anchored");
    if (!this.escrows.has(input.missionId)) throw new Error("Mission escrow not found");
    this.proofs.set(input.proofId, input);
    return this.confirmedTx();
  }

  async releaseReward(input: ReleaseRewardInput): Promise<ChainTransactionReceipt> {
    const escrow = this.requireEscrow(input.missionId);
    if (escrow.state !== "LOCKED") throw new Error("Reward release requires LOCKED escrow");
    escrow.state = "RELEASED";
    return this.confirmedTx();
  }

  async refundReward(missionId: string): Promise<ChainTransactionReceipt> {
    const escrow = this.requireEscrow(missionId);
    if (escrow.state !== "FUNDED" && escrow.state !== "LOCKED") {
      throw new Error("Refund requires FUNDED or LOCKED escrow");
    }
    escrow.state = "REFUNDED";
    return this.confirmedTx();
  }

  async getTransactionStatus(txId: string): Promise<ChainTransactionStatus> {
    return this.transactions.get(txId) ?? "FAILED";
  }

  private requireEscrow(missionId: string): EscrowRecord {
    const escrow = this.escrows.get(missionId);
    if (!escrow) throw new Error("Mission escrow not found");
    return escrow;
  }
}
