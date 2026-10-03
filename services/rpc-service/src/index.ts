import type { OsaDevnet } from "@osa/osa-devnet";

export interface RpcRequest {
  jsonrpc:"2.0";
  id:string|number;
  method:string;
  params?:readonly unknown[];
}

export interface RpcResponse {
  jsonrpc:"2.0";
  id:string|number;
  result?:unknown;
  error?:{code:number;message:string};
}

export function handleOsaRpc(devnet:OsaDevnet,request:RpcRequest):RpcResponse {
  const snapshot=devnet.explorer();
  switch(request.method){
    case "osa_chainId":
      return {jsonrpc:"2.0",id:request.id,result:snapshot.layers.L1.chainId};
    case "osa_blockNumber":
      return {jsonrpc:"2.0",id:request.id,result:snapshot.layers.L1.height};
    case "osa_networkStatus":
      return {jsonrpc:"2.0",id:request.id,result:snapshot};
    case "osa_getBlockByHash":{
      const hash=String(request.params?.[0]??"");
      const block=snapshot.recentBlocks.find(candidate=>candidate.blockHash===hash);
      return block
        ? {jsonrpc:"2.0",id:request.id,result:block}
        : {jsonrpc:"2.0",id:request.id,error:{code:-32001,message:"Block not found"}};
    }
    default:
      return {jsonrpc:"2.0",id:request.id,error:{code:-32601,message:"Method not found"}};
  }
}
