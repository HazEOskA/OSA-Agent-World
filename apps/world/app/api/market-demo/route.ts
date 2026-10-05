import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    error:"GONE",
    replacement:"/api/market",
    message:"Market demo został wyłączony. Real Market V1 nie używa REFERENCE_MARKET ani danych symulowanych."
  },{status:410});
}
