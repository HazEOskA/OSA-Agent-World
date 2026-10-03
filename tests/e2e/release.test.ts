import { describe,expect,it } from "vitest";
import { runReleaseReferenceLoop } from "../../packages/release-core/src/index.js";
import { RELEASE_SECURITY_CONFIG,evaluateReleaseSecurity } from "../../packages/security-core/src/index.js";

describe("OSA World release E2E",()=>{
  it("passes release loop and security gate together",async()=>{
    const [release,security]=await Promise.all([
      runReleaseReferenceLoop(),
      Promise.resolve(evaluateReleaseSecurity(RELEASE_SECURITY_CONFIG))
    ]);
    expect(release.status).toBe("PASS");
    expect(release.tasks.completed).toBe(60);
    expect(security.status).toBe("PASS");
  });
});
