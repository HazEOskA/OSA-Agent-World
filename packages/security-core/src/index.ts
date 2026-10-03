export interface ReleaseSecurityConfig {
  testnetOnly:boolean;
  rawPrivateKeysEmbedded:boolean;
  llmSettlementAuthority:boolean;
  userEditableReputation:boolean;
  proofRequiredForSettlement:boolean;
  executionBindingRequired:boolean;
  bridgeCompletionRequiresDestinationRedeem:boolean;
  simulationsLabeled:boolean;
}

export interface SecurityGateResult {
  status:"PASS"|"FAIL";
  failures:readonly string[];
}

export const RELEASE_SECURITY_CONFIG:ReleaseSecurityConfig={
  testnetOnly:true,
  rawPrivateKeysEmbedded:false,
  llmSettlementAuthority:false,
  userEditableReputation:false,
  proofRequiredForSettlement:true,
  executionBindingRequired:true,
  bridgeCompletionRequiresDestinationRedeem:true,
  simulationsLabeled:true
};

export function evaluateReleaseSecurity(config:ReleaseSecurityConfig):SecurityGateResult {
  const failures:string[]=[];
  if(!config.testnetOnly)failures.push("MAINNET_ENABLED");
  if(config.rawPrivateKeysEmbedded)failures.push("RAW_PRIVATE_KEYS");
  if(config.llmSettlementAuthority)failures.push("LLM_SETTLEMENT_AUTHORITY");
  if(config.userEditableReputation)failures.push("EDITABLE_REPUTATION");
  if(!config.proofRequiredForSettlement)failures.push("SETTLEMENT_WITHOUT_PROOF");
  if(!config.executionBindingRequired)failures.push("PROOF_WITHOUT_EXECUTION_BINDING");
  if(!config.bridgeCompletionRequiresDestinationRedeem)failures.push("BRIDGE_EARLY_COMPLETION");
  if(!config.simulationsLabeled)failures.push("UNLABELED_SIMULATION");
  return {status:failures.length===0?"PASS":"FAIL",failures};
}
