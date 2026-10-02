BEGIN;

INSERT INTO wallet_policies (
  id,
  allowed_assets,
  max_single_transaction,
  daily_limit,
  allowed_destinations,
  allowed_operations,
  human_approval_threshold,
  created_at
) VALUES (
  'pol_kai_01',
  '["OSA_USDC_TEST"]'::jsonb,
  5.000000,
  10.000000,
  '["registered_osa_services"]'::jsonb,
  '["receive_mission_reward","pay_approved_service"]'::jsonb,
  5.000000,
  '2026-10-03T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO agents (
  id,
  owner_id,
  public_key,
  wallet_address,
  policy_id,
  runtime_id,
  status,
  capabilities,
  created_at
) VALUES (
  'agt_kai_01',
  'human_reference_01',
  'devnet-placeholder-public-key',
  'devnet-placeholder-wallet',
  'pol_kai_01',
  'osa-runtime-v0.1',
  'ACTIVE',
  '["repository-inspection","code-analysis","security-audit","report-generation"]'::jsonb,
  '2026-10-03T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO agent_capabilities (agent_id, capability, created_at)
VALUES
  ('agt_kai_01', 'repository-inspection', '2026-10-03T00:00:00Z'),
  ('agt_kai_01', 'code-analysis', '2026-10-03T00:00:00Z'),
  ('agt_kai_01', 'security-audit', '2026-10-03T00:00:00Z'),
  ('agt_kai_01', 'report-generation', '2026-10-03T00:00:00Z')
ON CONFLICT DO NOTHING;

COMMIT;
