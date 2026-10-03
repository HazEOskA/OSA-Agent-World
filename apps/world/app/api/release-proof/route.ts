import { NextResponse } from "next/server";
import { runReleaseReferenceLoop } from "@osa/release-core";
import { RELEASE_SECURITY_CONFIG,evaluateReleaseSecurity } from "@osa/security-core";

export async function GET() {
  const release=await runReleaseReferenceLoop();
  const security=evaluateReleaseSecurity(RELEASE_SECURITY_CONFIG);
  return NextResponse.json({
    release,
    security,
    generatedAt:new Date().toISOString(),
    claim:"OSA Crypto World V0.1 reference implementation complete; production mainnet/decentralization are not claimed."
  });
}
