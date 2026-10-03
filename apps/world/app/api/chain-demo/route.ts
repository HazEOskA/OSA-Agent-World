import { NextResponse } from "next/server";
import { buildReferenceDevnet } from "@osa/osa-devnet";

export async function GET() {
  const devnet = buildReferenceDevnet();
  return NextResponse.json({
    mode: "SIMULATED",
    network: devnet.genesis.network,
    genesis: devnet.genesis,
    explorer: devnet.explorer(),
    truth: "EXECUTABLE DEVNET MODEL — NOT PERMISSIONLESS MAINNET"
  });
}
