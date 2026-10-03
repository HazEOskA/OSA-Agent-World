import { describe,expect,it } from "vitest";
import { buildReferenceDevnet } from "@osa/osa-devnet";
import { handleOsaRpc } from "./index.js";

describe("OSA RPC",()=>{
  it("returns devnet chain id and height",()=>{
    const devnet=buildReferenceDevnet();
    expect(handleOsaRpc(devnet,{jsonrpc:"2.0",id:1,method:"osa_chainId"}).result).toBe("osa-l1-devnet-91001");
    expect(Number(handleOsaRpc(devnet,{jsonrpc:"2.0",id:2,method:"osa_blockNumber"}).result)).toBeGreaterThan(0);
  });
});
