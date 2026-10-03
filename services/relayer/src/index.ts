export interface RelayMessage {
  messageId:string;
  source:string;
  destination:string;
  payloadDigest:string;
}

export interface RelayReceipt {
  messageId:string;
  status:"RELAYED"|"DUPLICATE";
  relayId:string;
}

export class OsaRelayer {
  #seen=new Set<string>();

  relay(message:RelayMessage):RelayReceipt {
    if(this.#seen.has(message.messageId)){
      return {messageId:message.messageId,status:"DUPLICATE",relayId:`rly_${message.messageId}`};
    }
    this.#seen.add(message.messageId);
    return {messageId:message.messageId,status:"RELAYED",relayId:`rly_${message.messageId}`};
  }
}
