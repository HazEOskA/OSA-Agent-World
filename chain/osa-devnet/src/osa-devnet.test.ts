import { describe, expect, it } from "vitest";
import { OsaDevnet, buildReferenceDevnet } from "./index.js";

describe("OSA devnet", () => {
  it("boots all L1/L2/L3 layers from genesis", () => {
    const devnet=new OsaDevnet();
    const snapshot=devnet.explorer();
    expect(snapshot.layers.L1.chainId).toBe("osa-l1-devnet-91001");
    expect(snapshot.layers.L3_AGENT.height).toBe(0);
  });

  it("settles L3_AGENT into L2 then L1", () => {
    const snapshot=buildReferenceDevnet().explorer();
    expect(snapshot.layers.L3_AGENT.height).toBe(1);
    expect(snapshot.layers.L2.height).toBe(2);
    expect(snapshot.layers.L1.height).toBe(2);
    expect(snapshot.anchors.some(a=>a.sourceLayer==="L3_AGENT"&&a.targetLayer==="L2")).toBe(true);
    expect(snapshot.anchors.some(a=>a.sourceLayer==="L2"&&a.targetLayer==="L1")).toBe(true);
  });

  it("rejects an invalid settlement route", () => {
    const devnet=new OsaDevnet();
    devnet.submit({txId:"otx_1",layer:"L3_AGENT",from:"a",to:"b",asset:"OSA",amount:"0",nonce:1,data:{}});
    devnet.produceBlock("L3_AGENT");
    expect(()=>devnet.anchorBlock("L3_AGENT","L1")).toThrow("Invalid settlement route");
  });
});
