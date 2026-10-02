BEGIN;

CREATE TABLE wallet_policies (
  id TEXT PRIMARY KEY,
  allowed_assets JSONB NOT NULL,
  max_single_transaction NUMERIC(30,6) NOT NULL,
  daily_limit NUMERIC(30,6) NOT NULL,
  allowed_destinations JSONB NOT NULL,
  allowed_operations JSONB NOT NULL,
  human_approval_threshold NUMERIC(30,6),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  runtime_id TEXT NOT NULL,
  status TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE agent_capabilities (
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (agent_id, capability)
);

CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  issuer_id TEXT NOT NULL,
  requirements JSONB NOT NULL,
  acceptance_criteria JSONB NOT NULL,
  reward_asset TEXT NOT NULL,
  reward_amount NUMERIC(30,6) NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL,
  assigned_agent_id TEXT REFERENCES agents(id),
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  status TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE evidence_records (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES executions(id),
  input_digest TEXT NOT NULL,
  repository_digest TEXT,
  runtime_digest TEXT NOT NULL,
  output_digest TEXT NOT NULL,
  evidence_root TEXT NOT NULL,
  observations JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE proof_receipts (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  execution_id TEXT NOT NULL REFERENCES executions(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  evidence_root TEXT NOT NULL,
  result_digest TEXT NOT NULL,
  runtime_digest TEXT NOT NULL,
  policy_digest TEXT NOT NULL,
  status TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE settlements (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  proof_id TEXT NOT NULL REFERENCES proof_receipts(id),
  recipient TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount NUMERIC(30,6) NOT NULL,
  status TEXT NOT NULL,
  chain_tx_id TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE reputation_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  type TEXT NOT NULL,
  mission_id TEXT REFERENCES missions(id),
  proof_id TEXT REFERENCES proof_receipts(id),
  settlement_id TEXT REFERENCES settlements(id),
  value JSONB NOT NULL,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE protocol_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  schema_version NUMERIC(10,0) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  payload_digest TEXT NOT NULL
);

CREATE INDEX missions_correlation_idx ON missions(correlation_id);
CREATE INDEX executions_correlation_idx ON executions(correlation_id);
CREATE INDEX settlements_correlation_idx ON settlements(correlation_id);
CREATE INDEX protocol_events_correlation_idx ON protocol_events(correlation_id);

COMMIT;
