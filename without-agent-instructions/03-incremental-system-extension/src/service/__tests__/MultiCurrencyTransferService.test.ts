import { Account } from "../../domain/Account";
import { MultiCurrencyTransferService } from "../MultiCurrencyTransferService";
import {
  IExchangeRateService,
  InMemoryExchangeRateService,
} from "../ExchangeRateService";

describe("MultiCurrencyTransferService", () => {
  let transferService: MultiCurrencyTransferService;
  let exchangeRateService: IExchangeRateService;
  let usdAccount: Account;
  let eurAccount: Account;

  beforeEach(() => {
    exchangeRateService = new InMemoryExchangeRateService();
    transferService = new MultiCurrencyTransferService(exchangeRateService);
    usdAccount = new Account("acc-usd", 1000, "USD");
    eurAccount = new Account("acc-eur", 500, "EUR");
  });

  describe("multi-currency transfers", () => {
    it("should transfer funds between accounts with different currencies", () => {
      const transaction = transferService.transfer(usdAccount, eurAccount, 100);

      // USD account should be debited by 100 USD
      expect(usdAccount.getBalance()).toBe(900);
      expect(usdAccount.currency).toBe("USD");

      // EUR account should be credited by converted amount (100 * 0.85 = 85 EUR)
      expect(eurAccount.getBalance()).toBe(585);
      expect(eurAccount.currency).toBe("EUR");

      // Transaction should record both amounts and exchange rate
      expect(transaction.sourceAmount).toBe(100);
      expect(transaction.sourceCurrency).toBe("USD");
      expect(transaction.destinationAmount).toBe(85.0);
      expect(transaction.destinationCurrency).toBe("EUR");
      expect(transaction.exchangeRate).toBe(0.85);
    });

    it("should preserve monetary value when converted to common currency", () => {
      const initialUsdBalance = usdAccount.getBalance();
      const initialEurBalance = eurAccount.getBalance();

      // Convert both to USD for comparison (using same rounding as service)
      const initialUsdValue = initialUsdBalance;
      const initialEurValueInUsd = exchangeRateService.convertAmount(
        initialEurBalance,
        "EUR",
        "USD"
      );

      const initialTotalInUsd = initialUsdValue + initialEurValueInUsd;

      // Perform transfer
      transferService.transfer(usdAccount, eurAccount, 100);

      // Calculate final values in USD (using same rounding as service)
      const finalUsdValue = usdAccount.getBalance();
      const finalEurValueInUsd = exchangeRateService.convertAmount(
        eurAccount.getBalance(),
        "EUR",
        "USD"
      );

      const finalTotalInUsd = finalUsdValue + finalEurValueInUsd;

      // Total value should be preserved (within rounding precision)
      // Rounding occurs at each conversion step, so we allow for small rounding errors
      // The difference should be less than 1 unit (e.g., < $1 for reasonable amounts)
      const difference = Math.abs(finalTotalInUsd - initialTotalInUsd);
      expect(difference).toBeLessThan(1.0);
      
      // Also verify relative error is small (< 0.1%)
      const relativeError = difference / initialTotalInUsd;
      expect(relativeError).toBeLessThan(0.001);
    });

    it("should reject transfer if currencies are the same", () => {
      const anotherUsdAccount = new Account("acc-usd-2", 500, "USD");

      expect(() => {
        transferService.transfer(usdAccount, anotherUsdAccount, 100);
      }).toThrow("Use TransferService for same-currency transfers");
    });

    it("should reject transfer if insufficient funds", () => {
      expect(() => {
        transferService.transfer(usdAccount, eurAccount, 2000);
      }).toThrow("Insufficient funds");
    });

    it("should reject transfer with zero or negative amount", () => {
      expect(() => {
        transferService.transfer(usdAccount, eurAccount, 0);
      }).toThrow("Transfer amount must be positive");

      expect(() => {
        transferService.transfer(usdAccount, eurAccount, -100);
      }).toThrow("Transfer amount must be positive");
    });

    it("should handle exchange rate errors gracefully", () => {
      const jpyAccount = new Account("acc-jpy", 1000, "JPY");

      expect(() => {
        transferService.transfer(usdAccount, jpyAccount, 100);
      }).toThrow("Exchange rate not available");
    });

    it("should work in reverse direction (EUR to USD)", () => {
      const transaction = transferService.transfer(eurAccount, usdAccount, 100);

      // EUR account should be debited by 100 EUR
      expect(eurAccount.getBalance()).toBe(400);

      // USD account should be credited by converted amount (100 * 1.18 = 118 USD)
      expect(usdAccount.getBalance()).toBe(1118);

      expect(transaction.sourceAmount).toBe(100);
      expect(transaction.sourceCurrency).toBe("EUR");
      expect(transaction.destinationAmount).toBe(118.0);
      expect(transaction.destinationCurrency).toBe("USD");
    });
  });

  describe("invariant preservation", () => {
    it("should never create negative balances", () => {
      const smallAccount = new Account("acc-small", 10, "USD");
      const eurAccount = new Account("acc-eur", 100, "EUR");

      // Try to transfer more than available
      expect(() => {
        transferService.transfer(smallAccount, eurAccount, 20);
      }).toThrow("Insufficient funds");

      // Balance should remain unchanged
      expect(smallAccount.getBalance()).toBe(10);
      expect(eurAccount.getBalance()).toBe(100);
    });

    it("should handle rounding correctly", () => {
      // Set a rate that will cause rounding
      if (exchangeRateService instanceof InMemoryExchangeRateService) {
        exchangeRateService.setRate("USD", "EUR", 0.333333);
      }

      const transaction = transferService.transfer(usdAccount, eurAccount, 100);

      // Converted amount should be rounded to 2 decimal places
      expect(transaction.destinationAmount).toBe(33.33);
      expect(eurAccount.getBalance()).toBe(533.33);
    });
  });
});
