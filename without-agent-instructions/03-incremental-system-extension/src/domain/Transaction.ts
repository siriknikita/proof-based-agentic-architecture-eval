/**
 * Represents a financial transaction between accounts.
 */
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly fromAccountId: string,
    public readonly toAccountId: string,
    public readonly amount: number,
    public readonly timestamp: Date = new Date()
  ) {
    if (amount <= 0) {
      throw new Error("Transaction amount must be positive");
    }
    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }
  }
}
