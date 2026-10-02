import { createHash } from "node:crypto";

export type ProtocolEventType =
  | "agent.created"
  | "mission.created"
  | "mission.funded"
  | "mission.accepted"
  | "mission.started"
  | "mission.submitted"
  | "mission.completed"
  | "mission.failed"
  | "execution.started"
  | "execution.completed"
  | "execution.failed"
  | "evidence.created"
  | "proof.created"
  | "proof.verified"
  | "proof.failed"
  | "proof.revoked"
  | "settlement.requested"
  | "settlement.released"
  | "settlement.failed"
  | "reputation.updated";

export interface ProtocolEvent<TPayload = unknown> {
  eventId: string;
  type: ProtocolEventType;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  causationId: string | null;
  schemaVersion: number;
  occurredAt: string;
  payload: TPayload;
  payloadDigest: string;
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("Unsupported canonical value");
    return encoded;
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }

  throw new Error(`Unsupported canonical value type: ${typeof value}`);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function digestPayload(payload: unknown): string {
  return sha256Hex(canonicalize(payload));
}

export function createProtocolEvent<TPayload>(
  input: Omit<ProtocolEvent<TPayload>, "payloadDigest">
): ProtocolEvent<TPayload> {
  return {
    ...input,
    payloadDigest: digestPayload(input.payload)
  };
}
