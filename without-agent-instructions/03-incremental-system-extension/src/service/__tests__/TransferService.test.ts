import { Account } from "../../domain/Account";
import { TransferService } from "../TransferService";

describe("TransferService", () => {
  let transferService: TransferService;
  let account1: Account;
  let account2: Account;

  beforeEach(() => {
    transferService = new TransferService();
    account1 = new Account("acc-1", 1000, "USD");
    account2 = new Account("acc-2", 500, "USD");
  });

  describe("single-currency transfers", () => {
    it("should transfer funds between accounts with same currency", () => {
      const transaction = transferService.transfer(account1, account2, 200);

      expect(account1.getBalance()).toBe(800);
      expect(account2.getBalance()).toBe(700);
      expect(transaction.amount).toBe(200);
      expect(transaction.fromAccountId).toBe("acc-1");
      expect(transaction.toAccountId).toBe("acc-2");
    });

    it("should preserve total balance across accounts", () => {
      const initialTotal = account1.getBalance() + account2.getBalance();
      transferService.transfer(account1, account2, 200);
      const finalTotal = account1.getBalance() + account2.getBalance();

      expect(finalTotal).toBe(initialTotal);
    });

    it("should reject transfer if currencies do not match", () => {
      const eurAccount = new Account("acc-eur", 1000, "EUR");

      expect(() => {
        transferService.transfer(account1, eurAccount, 200);
      }).toThrow("Currency mismatch");
    });

    it("should reject transfer if insufficient funds", () => {
      expect(() => {
        transferService.transfer(account1, account2, 2000);
      }).toThrow("Insufficient funds");
    });

    it("should reject transfer with zero or negative amount", () => {
      expect(() => {
        transferService.transfer(account1, account2, 0);
      }).toThrow("Transfer amount must be positive");

      expect(() => {
        transferService.transfer(account1, account2, -100);
      }).toThrow("Transfer amount must be positive");
    });

    it("should record all transactions", () => {
      transferService.transfer(account1, account2, 100);
      transferService.transfer(account2, account1, 50);

      const transactions = transferService.getTransactions();
      expect(transactions).toHaveLength(2);
    });
  });
});
