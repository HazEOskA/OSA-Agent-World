import { describe,expect,it } from "vitest";
import { REFERENCE_MARKET,discoverServices } from "./index.js";

describe("market discovery",()=>{
  it("finds an auditable agent under price limit",()=>{
    const results=discoverServices(REFERENCE_MARKET,{capability:"code.audit",maxPrice:5});
    expect(results[0]?.listing.listingId).toBe("lst_agent_kai");
  });

  it("filters unavailable price ranges",()=>{
    expect(discoverServices(REFERENCE_MARKET,{capability:"compute.gpu",maxPrice:1})).toHaveLength(0);
  });
});
