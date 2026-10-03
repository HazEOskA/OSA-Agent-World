import {
  asExecutionId,
  type Agent,
  type Execution,
  type Mission
} from "@osa/domain";

export interface RuntimeAction {
  operation: "repo.read" | "code.audit" | "dependency.inspect" | "report.generate";
  target: string;
  mutatesTarget: boolean;
}

export interface AuthorityDecision {
  decision: "ALLOW" | "DENY";
  reason: string;
}

export function authorityGate(agent: Agent, action: RuntimeAction): AuthorityDecision {
  if (agent.status !== "ACTIVE") return { decision: "DENY", reason: "AGENT_INACTIVE" };
  if (!agent.capabilities.includes(action.operation)) {
    return { decision: "DENY", reason: "CAPABILITY_MISSING" };
  }
  if (action.mutatesTarget) {
    return { decision: "DENY", reason: "REFERENCE_RUNTIME_READ_ONLY" };
  }
  return { decision: "ALLOW", reason: "AUTHORIZED" };
}

export interface RuntimeResult {
  execution: Execution;
  observations: readonly string[];
  output: string;
  actions: readonly RuntimeAction[];
}

export interface OsaRuntimeAdapter {
  execute(agent: Agent, mission: Mission): Promise<RuntimeResult>;
}

export class ReferenceOsaRuntime implements OsaRuntimeAdapter {
  async execute(agent: Agent, mission: Mission): Promise<RuntimeResult> {
    if (mission.assignedAgentId !== agent.agentId) throw new Error("Mission-agent binding mismatch");
    if (mission.status !== "EXECUTING") throw new Error("Mission must be EXECUTING");

    const actions: RuntimeAction[] = [
      { operation: "repo.read", target: "public-repository", mutatesTarget: false },
      { operation: "code.audit", target: "public-repository", mutatesTarget: false },
      { operation: "dependency.inspect", target: "package-manifest", mutatesTarget: false },
      { operation: "report.generate", target: "audit-report", mutatesTarget: false }
    ];

    for (const action of actions) {
      const decision = authorityGate(agent, action);
      if (decision.decision !== "ALLOW") {
        throw new Error(`Authority denied: ${decision.reason}`);
      }
    }

    const now = new Date().toISOString();
    return {
      execution: {
        executionId: asExecutionId("exe_kai_reference_001"),
        missionId: mission.missionId,
        agentId: agent.agentId,
        status: "COMPLETED",
        correlationId: mission.correlationId,
        causationId: null,
        startedAt: now,
        completedAt: now
      },
      observations: [
        "Repository inspected in read-only mode",
        "Dependency manifest inspected",
        "Structured audit report generated"
      ],
      output: "AUDIT_REPORT: reference execution completed",
      actions
    };
  }
}
