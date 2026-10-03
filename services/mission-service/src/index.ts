import {
  assertMissionTransition,
  asAgentId,
  asMissionId,
  type AgentId,
  type Mission,
  type MissionId,
  type MissionStatus
} from "@osa/domain";

export interface CreateMissionInput {
  missionId?: string;
  issuerId: string;
  requirements: readonly string[];
  acceptanceCriteria: readonly string[];
  rewardAsset: string;
  rewardAmount: string;
  deadline?: string | null;
  correlationId: string;
  createdAt?: string;
}

export class MissionService {
  #missions = new Map<MissionId, Mission>();

  create(input: CreateMissionInput): Mission {
    const missionId = asMissionId(input.missionId ?? `mis_${this.#missions.size + 1}`);
    if (this.#missions.has(missionId)) throw new Error("Mission already exists");

    const mission: Mission = {
      missionId,
      issuerId: input.issuerId,
      requirements: input.requirements,
      acceptanceCriteria: input.acceptanceCriteria,
      rewardAsset: input.rewardAsset,
      rewardAmount: input.rewardAmount,
      deadline: input.deadline ?? null,
      status: "CREATED",
      assignedAgentId: null,
      correlationId: input.correlationId,
      createdAt: input.createdAt ?? new Date().toISOString()
    };

    this.#missions.set(missionId, mission);
    return mission;
  }

  get(missionId: MissionId): Mission {
    const mission = this.#missions.get(missionId);
    if (!mission) throw new Error("Mission not found");
    return mission;
  }

  transition(missionId: MissionId, to: MissionStatus): Mission {
    const mission = this.get(missionId);
    assertMissionTransition(mission.status, to);
    const next = { ...mission, status: to };
    this.#missions.set(missionId, next);
    return next;
  }

  assign(missionId: MissionId, agentId: string | AgentId): Mission {
    const mission = this.get(missionId);
    if (mission.status !== "OPEN") throw new Error("Mission must be OPEN before assignment");
    const next = {
      ...mission,
      assignedAgentId:
        typeof agentId === "string" ? asAgentId(agentId) : agentId
    };
    this.#missions.set(missionId, next);
    return next;
  }
}
