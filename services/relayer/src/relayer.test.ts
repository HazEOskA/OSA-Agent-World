import { describe,expect,it } from "vitest";
import { OsaRelayer } from "./index.js";

describe("relayer",()=>{
  it("is idempotent by message id",()=>{
    const relayer=new OsaRelayer();
    const message={messageId:"msg_1",source:"L3",destination:"L2",payloadDigest:"abc"};
    expect(relayer.relay(message).status).toBe("RELAYED");
    expect(relayer.relay(message).status).toBe("DUPLICATE");
  });
});
