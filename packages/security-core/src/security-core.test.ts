import { describe,expect,it } from "vitest";
import { RELEASE_SECURITY_CONFIG,evaluateReleaseSecurity } from "./index.js";

describe("release security gate",()=>{
  it("passes the locked alpha policy",()=>{
    expect(evaluateReleaseSecurity(RELEASE_SECURITY_CONFIG)).toEqual({status:"PASS",failures:[]});
  });

  it("fails unsafe settlement authority",()=>{
    const result=evaluateReleaseSecurity({...RELEASE_SECURITY_CONFIG,llmSettlementAuthority:true});
    expect(result.status).toBe("FAIL");
    expect(result.failures).toContain("LLM_SETTLEMENT_AUTHORITY");
  });
});
