import { describe,expect,it } from "vitest";
import { buildReferenceDevnet } from "@osa/osa-devnet";
import { buildReferenceNetwork,simulateFinality } from "./index.js";

describe("network core",()=>{
  it("builds node topology with validators, sequencer and RPC",()=>{
    const topology=buildReferenceNetwork().topology();
    expect(topology.nodes.some(node=>node.type==="VALIDATOR")).toBe(true);
    expect(topology.nodes.some(node=>node.type==="SEQUENCER")).toBe(true);
    expect(topology.nodes.some(node=>node.type==="RPC")).toBe(true);
    expect(topology.edges.length).toBeGreaterThan(0);
  });

  it("requires two thirds plus one for finality",()=>{
    const block=buildReferenceDevnet().explorer().recentBlocks[0];
    if(!block) throw new Error("Missing block");
    expect(simulateFinality(block,[true,true,false]).finalized).toBe(true);
    expect(simulateFinality(block,[true,false,false]).finalized).toBe(false);
  });
});
