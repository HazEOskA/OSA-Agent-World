import { describe, expect, it } from "vitest";
import { initialWorldEvent, reduceWorldState, type WorldState } from "./world";

describe("world state", () => {
  it("moves the active district through protocol-style events", () => {
    const state: WorldState = {
      activeDistrict: "nexus",
      teleporting: false,
      lastEvent: initialWorldEvent
    };

    const next = reduceWorldState(state, {
      id: "w_evt_0002",
      type: "district.teleport.started",
      district: "bridge",
      label: "TELEPORT / BRIDGE",
      mode: "REAL"
    });

    expect(next.activeDistrict).toBe("bridge");
    expect(next.teleporting).toBe(true);
  });
});
