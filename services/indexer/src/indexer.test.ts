import { describe,expect,it } from "vitest";
import { buildReferenceDevnet } from "@osa/osa-devnet";
import { indexSnapshot,searchIndex } from "./index.js";

describe("indexer",()=>{
  it("indexes blocks, transactions and anchors",()=>{
    const index=indexSnapshot(buildReferenceDevnet().explorer());
    expect(index.some(entity=>entity.kind==="BLOCK")).toBe(true);
    expect(index.some(entity=>entity.kind==="TRANSACTION")).toBe(true);
    expect(searchIndex(index,"L3_AGENT").length).toBeGreaterThan(0);
  });
});
