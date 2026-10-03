export type BridgeMode = "SIMULATED" | "TESTNET";
export type BridgeStage =
  | "IDLE"
  | "ROUTED"
  | "SOURCE_SUBMITTED"
  | "SOURCE_CONFIRMED"
  | "ATTESTING"
  | "ATTESTED"
  | "DESTINATION_SUBMITTED"
  | "COMPLETED"
  | "FAILED";

export interface BridgeRoute {
  routeId: string;
  mode: BridgeMode;
  protocol: string;
  sourceChain: string;
  destinationChain: string;
  asset: string;
  amount: string;
  recipient: string;
  estimatedSeconds: number;
  securityModel: string;
}

export interface BridgeTraceStep {
  stage: BridgeStage;
  at: string;
  mode: BridgeMode;
  label: string;
  txId?: string;
}

export interface BridgeTrace {
  traceId: string;
  route: BridgeRoute;
  stage: BridgeStage;
  steps: readonly BridgeTraceStep[];
}

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createSimulatedBridgeRoute(input: {
  sourceChain: string;
  destinationChain: string;
  asset: string;
  amount: string;
  recipient: string;
}): BridgeRoute {
  if (input.sourceChain === input.destinationChain) {
    throw new Error("Bridge route requires two different chains");
  }
  if (!input.amount || Number(input.amount) <= 0) {
    throw new Error("Bridge amount must be positive");
  }

  return {
    routeId: stableId(
      "brt",
      `${input.sourceChain}:${input.destinationChain}:${input.asset}:${input.amount}:${input.recipient}`
    ),
    mode: "SIMULATED",
    protocol: "OSA_BRIDGE_SIM",
    ...input,
    estimatedSeconds: 18,
    securityModel: "simulation-only"
  };
}

export function createBridgeTrace(route: BridgeRoute, now = new Date()): BridgeTrace {
  return {
    traceId: stableId("xtr", route.routeId),
    route,
    stage: "ROUTED",
    steps: [
      {
        stage: "ROUTED",
        at: now.toISOString(),
        mode: route.mode,
        label: "ROUTE CREATED"
      }
    ]
  };
}

export function appendBridgeTrace(
  trace: BridgeTrace,
  step: Omit<BridgeTraceStep, "at"> & { at?: string }
): BridgeTrace {
  const nextStep: BridgeTraceStep = {
    ...step,
    at: step.at ?? new Date().toISOString()
  };

  return {
    ...trace,
    stage: nextStep.stage,
    steps: [...trace.steps, nextStep]
  };
}

export async function runSimulatedBridge(
  route: BridgeRoute,
  onStep?: (trace: BridgeTrace) => void
): Promise<BridgeTrace> {
  if (route.mode !== "SIMULATED") throw new Error("Expected simulated route");

  let trace = createBridgeTrace(route);
  onStep?.(trace);

  const stages: readonly BridgeTraceStep[] = [
    {
      stage: "SOURCE_SUBMITTED",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "SOURCE TRANSACTION SUBMITTED",
      txId: "sim_source_tx"
    },
    {
      stage: "SOURCE_CONFIRMED",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "SOURCE FINALITY"
    },
    {
      stage: "ATTESTING",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "WORMHOLE-LIKE ATTESTATION WAIT"
    },
    {
      stage: "ATTESTED",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "ATTESTATION READY"
    },
    {
      stage: "DESTINATION_SUBMITTED",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "DESTINATION REDEEM SUBMITTED",
      txId: "sim_destination_tx"
    },
    {
      stage: "COMPLETED",
      at: new Date().toISOString(),
      mode: "SIMULATED",
      label: "CROSS-CHAIN TRANSFER COMPLETE"
    }
  ];

  for (const step of stages) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    trace = appendBridgeTrace(trace, step);
    onStep?.(trace);
  }

  return trace;
}
