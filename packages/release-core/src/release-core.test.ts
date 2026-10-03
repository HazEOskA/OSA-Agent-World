import { describe,expect,it } from "vitest";
import { runReleaseReferenceLoop } from "./index.js";

describe("OSA release reference loop",()=>{
  it("closes the full agent → proof → economy → chain → market path",async()=>{
    const proof=await runReleaseReferenceLoop();
    expect(proof.status).toBe("PASS");
    expect(proof.tasks).toEqual({completed:60,total:60});
    expect(proof.steps.map(step=>step.code)).toEqual([
      "MISSION_CREATED","EXECUTION","EVIDENCE","PROOF_VERIFIED","SETTLEMENT",
      "REPUTATION","DEFI","BRIDGE","CHAIN","NETWORK","MARKET"
    ]);
  });
});
