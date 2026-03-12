export class BlockedByRetailerError extends Error {
  readonly retailerId: string;

  constructor(retailerId: string, message = "Blocked by retailer anti-bot protections") {
    super(message);
    this.name = "BlockedByRetailerError";
    this.retailerId = retailerId;
  }
}
