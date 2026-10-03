import {
  asSettlementId,
  canReleaseSettlement,
  type EscrowState,
  type Mission,
  type ProofReceipt,
  type Settlement
} from "@osa/domain";

export interface Escrow {
  escrowId: string;
  missionId: Mission["missionId"];
  asset: string;
  amount: string;
  state: EscrowState;
}

export class SettlementService {
  createEscrow(mission: Mission): Escrow {
    return {
      escrowId: `esc_${mission.missionId.slice(4)}`,
      missionId: mission.missionId,
      asset: mission.rewardAsset,
      amount: mission.rewardAmount,
      state: "UNFUNDED"
    };
  }

  fund(escrow: Escrow): Escrow {
    if (escrow.state !== "UNFUNDED") throw new Error("Escrow must be UNFUNDED");
    return { ...escrow, state: "FUNDED" };
  }

  lock(escrow: Escrow): Escrow {
    if (escrow.state !== "FUNDED") throw new Error("Escrow must be FUNDED");
    return { ...escrow, state: "LOCKED" };
  }

  release(input: {
    escrow: Escrow;
    mission: Mission;
    proof: ProofReceipt;
    recipient: string;
  }): { escrow: Escrow; settlement: Settlement } {
    if (!canReleaseSettlement(input.mission.status, input.proof.status, input.escrow.state)) {
      throw new Error("Settlement gate rejected");
    }

    const settlementId = asSettlementId(`stl_${input.mission.missionId.slice(4)}`);
    return {
      escrow: { ...input.escrow, state: "RELEASED" },
      settlement: {
        settlementId,
        missionId: input.mission.missionId,
        proofId: input.proof.proofId,
        recipient: input.recipient,
        asset: input.escrow.asset,
        amount: input.escrow.amount,
        status: "RELEASED",
        chainTxId: `simulated:${settlementId}`,
        createdAt: new Date().toISOString()
      }
    };
  }
}
