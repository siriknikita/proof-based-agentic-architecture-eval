import { Account } from "../domain/Account";
import { Transaction } from "../domain/Transaction";

/**
 * Service for processing single-currency transfers between accounts.
 * 
 * Invariants:
 * - Both accounts must have the same currency
 * - Total balance across both accounts remains constant
 * - No account balance can become negative
 */
export class TransferService {
  private transactions: Transaction[] = [];

  /**
   * Transfers funds from one account to another.
   * Both accounts must have the same currency.
   * 
   * @param fromAccount Source account
   * @param toAccount Destination account
   * @param amount Amount to transfer
   * @returns The created transaction
   */
  transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number
  ): Transaction {
    // Validate currencies match
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error(
        `Currency mismatch: ${fromAccount.currency} != ${toAccount.currency}`
      );
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    // Check sufficient funds
    if (fromAccount.getBalance() < amount) {
      throw new Error("Insufficient funds");
    }

    // Perform transfer
    fromAccount.withdraw(amount);
    toAccount.deposit(amount);

    // Record transaction
    const transaction = new Transaction(
      this.generateTransactionId(),
      fromAccount.id,
      toAccount.id,
      amount
    );
    this.transactions.push(transaction);

    return transaction;
  }

  /**
   * Gets all transactions processed by this service.
   */
  getTransactions(): readonly Transaction[] {
    return [...this.transactions];
  }

  private generateTransactionId(): string {
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
