import { Account } from "../domain/Account";
import { MultiCurrencyTransaction } from "../domain/MultiCurrencyTransaction";
import { IExchangeRateService } from "./ExchangeRateService";

/**
 * Service for processing multi-currency transfers between accounts.
 * 
 * This service extends the system to support transfers between accounts
 * with different currencies, using exchange rates for conversion.
 * 
 * Invariants:
 * - Accounts may have different currencies
 * - Source account is debited in its currency
 * - Destination account is credited in its currency (after conversion)
 * - Monetary value is preserved (when converted to a common currency)
 * - No account balance can become negative
 * 
 * This service is isolated from the existing TransferService to ensure
 * backward compatibility and maintain separation of concerns.
 */
export class MultiCurrencyTransferService {
  constructor(private exchangeRateService: IExchangeRateService) {}

  /**
   * Transfers funds from one account to another, handling currency conversion.
   * 
   * @param fromAccount Source account
   * @param toAccount Destination account
   * @param amount Amount to transfer in the source account's currency
   * @returns The created multi-currency transaction
   * @throws Error if currencies are the same (use TransferService instead),
   *         if exchange rate is unavailable, or if transfer cannot be completed
   */
  transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number
  ): MultiCurrencyTransaction {
    // Validate that currencies are different
    if (fromAccount.currency === toAccount.currency) {
      throw new Error(
        `Both accounts have the same currency (${fromAccount.currency}). ` +
        `Use TransferService for same-currency transfers.`
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

    // Get exchange rate and convert amount
    const exchangeRate = this.exchangeRateService.getExchangeRate(
      fromAccount.currency,
      toAccount.currency
    );
    const convertedAmount = this.exchangeRateService.convertAmount(
      amount,
      fromAccount.currency,
      toAccount.currency
    );

    // Perform transfer
    // Withdraw from source account in its currency
    fromAccount.withdraw(amount);
    
    // Deposit to destination account in its currency (converted amount)
    toAccount.deposit(convertedAmount);

    // Record transaction
    const transaction = new MultiCurrencyTransaction(
      this.generateTransactionId(),
      fromAccount.id,
      toAccount.id,
      amount,
      fromAccount.currency,
      convertedAmount,
      toAccount.currency,
      exchangeRate
    );

    return transaction;
  }

  private generateTransactionId(): string {
    return `mctxn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
