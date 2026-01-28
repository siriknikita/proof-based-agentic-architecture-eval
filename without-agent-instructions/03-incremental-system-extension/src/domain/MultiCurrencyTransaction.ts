import { Transaction } from "./Transaction";

/**
 * Represents a financial transaction between accounts with different currencies.
 * 
 * This extends the transaction concept to include currency conversion information,
 * which is necessary for auditability and compliance in multi-currency systems.
 */
export class MultiCurrencyTransaction {
  constructor(
    public readonly id: string,
    public readonly fromAccountId: string,
    public readonly toAccountId: string,
    public readonly sourceAmount: number,
    public readonly sourceCurrency: string,
    public readonly destinationAmount: number,
    public readonly destinationCurrency: string,
    public readonly exchangeRate: number,
    public readonly timestamp: Date = new Date()
  ) {
    if (sourceAmount <= 0) {
      throw new Error("Source amount must be positive");
    }
    if (destinationAmount <= 0) {
      throw new Error("Destination amount must be positive");
    }
    if (exchangeRate <= 0) {
      throw new Error("Exchange rate must be positive");
    }
    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }
    if (sourceCurrency === destinationCurrency) {
      throw new Error(
        "MultiCurrencyTransaction requires different currencies. Use Transaction for same-currency transfers."
      );
    }
  }

  /**
   * Gets the base transaction information (for compatibility/interoperability).
   */
  toTransaction(): Transaction {
    return new Transaction(
      this.id,
      this.fromAccountId,
      this.toAccountId,
      this.sourceAmount,
      this.timestamp
    );
  }
}
