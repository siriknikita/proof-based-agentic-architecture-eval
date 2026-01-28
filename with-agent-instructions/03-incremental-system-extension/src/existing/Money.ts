/**
 * Existing system: Money value object
 * Represents a monetary amount with its currency
 */
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    if (!currency || currency.trim() === "") {
      throw new Error("Currency must be specified");
    }
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
