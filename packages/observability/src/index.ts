import { randomUUID } from "node:crypto";

export interface TraceContext {
  traceId: string;
  correlationId: string;
  causationId: string | null;
  actorId?: string;
  missionId?: string;
  executionId?: string;
}

export interface LogEnvelope<T = unknown> {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  trace: TraceContext;
  data?: T;
}

export function createTraceContext(input: Partial<TraceContext> = {}): TraceContext {
  return {
    traceId: input.traceId ?? `trc_${randomUUID()}`,
    correlationId: input.correlationId ?? `cor_${randomUUID()}`,
    causationId: input.causationId ?? null,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.missionId ? { missionId: input.missionId } : {}),
    ...(input.executionId ? { executionId: input.executionId } : {})
  };
}

export function childTrace(parent: TraceContext, causationId: string): TraceContext {
  return { ...parent, traceId: `trc_${randomUUID()}`, causationId };
}

export function createLogEnvelope<T>(
  level: LogEnvelope<T>["level"],
  message: string,
  trace: TraceContext,
  data?: T
): LogEnvelope<T> {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    trace,
    ...(data === undefined ? {} : { data })
  };
}
