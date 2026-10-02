import { describe, expect, it } from "vitest";
import { InMemoryChainAdapter } from "./index.js";

describe("InMemoryChainAdapter contract", () => {
  it("completes the economic chain abstraction loop", async () => {
    const chain = new InMemoryChainAdapter();

    await chain.registerAgent({
      agentId: "agt_kai_01",
      owner: "human_01",
      wallet: "wallet_kai_01",
      identityDigest: "a".repeat(64)
    });

    await chain.createMissionEscrow({
      missionId: "mis_01",
      issuer: "human_01",
      asset: "OSA_USDC_TEST",
      amount: "5.000000"
    });

    expect(await chain.getEscrowState("mis_01")).toBe("UNFUNDED");

    await chain.fundMission("mis_01");
    expect(await chain.getEscrowState("mis_01")).toBe("FUNDED");

    await chain.lockMission("mis_01");
    expect(await chain.getEscrowState("mis_01")).toBe("LOCKED");

    await chain.anchorProof({
      proofId: "prf_01",
      agentId: "agt_kai_01",
      missionId: "mis_01",
      executionId: "exe_01",
      evidenceRoot: "b".repeat(64),
      resultDigest: "c".repeat(64),
      runtimeDigest: "d".repeat(64),
      policyDigest: "e".repeat(64)
    });

    const release = await chain.releaseReward({
      missionId: "mis_01",
      settlementId: "stl_01",
      recipient: "wallet_kai_01"
    });

    expect(await chain.getEscrowState("mis_01")).toBe("RELEASED");
    expect(await chain.getTransactionStatus(release.txId)).toBe("CONFIRMED");
  });

  it("blocks double release", async () => {
    const chain = new InMemoryChainAdapter();

    await chain.createMissionEscrow({
      missionId: "mis_02",
      issuer: "human_01",
      asset: "OSA_USDC_TEST",
      amount: "5.000000"
    });
    await chain.fundMission("mis_02");
    await chain.lockMission("mis_02");
    await chain.releaseReward({
      missionId: "mis_02",
      settlementId: "stl_02",
      recipient: "wallet_kai_01"
    });

    await expect(
      chain.releaseReward({
        missionId: "mis_02",
        settlementId: "stl_03",
        recipient: "wallet_kai_01"
      })
    ).rejects.toThrow(/LOCKED/);
  });
});
