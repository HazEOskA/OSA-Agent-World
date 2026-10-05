import { describe,expect,it } from "vitest";
import {
  deriveMarketAvailability,
  discoverServices,
  materializeMarketListing,
  type MarketListingRecord
} from "./index.js";

const NOW=new Date("2026-10-05T15:00:00.000Z");

function record(overrides:Partial<MarketListingRecord>={}):MarketListingRecord {
  return {
    listingId:"lst_skill_dep",
    kind:"SKILL",
    sellerId:"osa:skills",
    title:"Dependency Risk Skill",
    capabilities:["dependency.inspect"],
    priceAsset:"OSA_USDC_TEST",
    priceAmount:"1",
    reputation:90,
    endpoint:"https://agents.example.test/dependency-risk",
    registeredAt:"2026-10-05T14:00:00.000Z",
    lastSeenAt:"2026-10-05T14:59:30.000Z",
    ...overrides
  };
}

describe("market discovery",()=>{
  it("derives availability from a real heartbeat timestamp",()=>{
    expect(deriveMarketAvailability("2026-10-05T14:59:30.000Z",NOW)).toBe("LIVE");
    expect(deriveMarketAvailability("2026-10-05T14:00:00.000Z",NOW)).toBe("OFFLINE");
    expect(deriveMarketAvailability(null,NOW)).toBe("UNKNOWN");
  });

  it("finds only live services under price limit",()=>{
    const live=materializeMarketListing(record(),NOW);
    const offline=materializeMarketListing(record({
      listingId:"lst_offline",
      lastSeenAt:"2026-10-05T14:00:00.000Z"
    }),NOW);
    const results=discoverServices([live,offline],{capability:"dependency.inspect",maxPrice:2});
    expect(results.map(item=>item.listing.listingId)).toEqual(["lst_skill_dep"]);
  });

  it("filters unavailable price ranges",()=>{
    const live=materializeMarketListing(record({priceAmount:"2"}),NOW);
    expect(discoverServices([live],{capability:"dependency.inspect",maxPrice:1})).toHaveLength(0);
  });
});
