import {
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "string" }).notNull();

export const walletPolicies = pgTable("wallet_policies", {
  id: text("id").primaryKey(),
  allowedAssets: jsonb("allowed_assets").$type<string[]>().notNull(),
  maxSingleTransaction: numeric("max_single_transaction", { precision: 30, scale: 6 }).notNull(),
  dailyLimit: numeric("daily_limit", { precision: 30, scale: 6 }).notNull(),
  allowedDestinations: jsonb("allowed_destinations").$type<string[]>().notNull(),
  allowedOperations: jsonb("allowed_operations").$type<string[]>().notNull(),
  humanApprovalThreshold: numeric("human_approval_threshold", { precision: 30, scale: 6 }),
  createdAt: createdAt()
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  publicKey: text("public_key").notNull(),
  walletAddress: text("wallet_address").notNull(),
  policyId: text("policy_id").notNull(),
  runtimeId: text("runtime_id").notNull(),
  status: text("status").notNull(),
  capabilities: jsonb("capabilities").$type<string[]>().notNull(),
  createdAt: createdAt()
});

export const agentCapabilities = pgTable(
  "agent_capabilities",
  {
    agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
    capability: text("capability").notNull(),
    createdAt: createdAt()
  },
  (table) => [primaryKey({ columns: [table.agentId, table.capability] })]
);

export const missions = pgTable("missions", {
  id: text("id").primaryKey(),
  issuerId: text("issuer_id").notNull(),
  requirements: jsonb("requirements").$type<string[]>().notNull(),
  acceptanceCriteria: jsonb("acceptance_criteria").$type<string[]>().notNull(),
  rewardAsset: text("reward_asset").notNull(),
  rewardAmount: numeric("reward_amount", { precision: 30, scale: 6 }).notNull(),
  deadline: timestamp("deadline", { withTimezone: true, mode: "string" }),
  status: text("status").notNull(),
  assignedAgentId: text("assigned_agent_id").references(() => agents.id),
  correlationId: text("correlation_id").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull()
});

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  missionId: text("mission_id").notNull().references(() => missions.id),
  agentId: text("agent_id").notNull().references(() => agents.id),
  status: text("status").notNull(),
  correlationId: text("correlation_id").notNull(),
  causationId: text("causation_id"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" })
});

export const evidenceRecords = pgTable("evidence_records", {
  id: text("id").primaryKey(),
  executionId: text("execution_id").notNull().references(() => executions.id),
  inputDigest: text("input_digest").notNull(),
  repositoryDigest: text("repository_digest"),
  runtimeDigest: text("runtime_digest").notNull(),
  outputDigest: text("output_digest").notNull(),
  evidenceRoot: text("evidence_root").notNull(),
  observations: jsonb("observations").$type<string[]>().notNull(),
  createdAt: createdAt()
});

export const proofReceipts = pgTable("proof_receipts", {
  id: text("id").primaryKey(),
  missionId: text("mission_id").notNull().references(() => missions.id),
  executionId: text("execution_id").notNull().references(() => executions.id),
  agentId: text("agent_id").notNull().references(() => agents.id),
  evidenceRoot: text("evidence_root").notNull(),
  resultDigest: text("result_digest").notNull(),
  runtimeDigest: text("runtime_digest").notNull(),
  policyDigest: text("policy_digest").notNull(),
  status: text("status").notNull(),
  signature: text("signature").notNull(),
  createdAt: createdAt()
});

export const settlements = pgTable("settlements", {
  id: text("id").primaryKey(),
  missionId: text("mission_id").notNull().references(() => missions.id),
  proofId: text("proof_id").notNull().references(() => proofReceipts.id),
  recipient: text("recipient").notNull(),
  asset: text("asset").notNull(),
  amount: numeric("amount", { precision: 30, scale: 6 }).notNull(),
  status: text("status").notNull(),
  chainTxId: text("chain_tx_id"),
  correlationId: text("correlation_id").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull()
});

export const reputationEvents = pgTable("reputation_events", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().references(() => agents.id),
  type: text("type").notNull(),
  missionId: text("mission_id").references(() => missions.id),
  proofId: text("proof_id").references(() => proofReceipts.id),
  settlementId: text("settlement_id").references(() => settlements.id),
  value: jsonb("value").$type<Record<string, string | number | boolean>>().notNull(),
  correlationId: text("correlation_id").notNull(),
  createdAt: createdAt()
});

export const protocolEvents = pgTable("protocol_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  correlationId: text("correlation_id").notNull(),
  causationId: text("causation_id"),
  schemaVersion: numeric("schema_version", { precision: 10, scale: 0 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull(),
  payload: jsonb("payload").notNull(),
  payloadDigest: text("payload_digest").notNull()
});
