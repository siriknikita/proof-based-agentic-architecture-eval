/**
 * Represents a financial account with a balance in a single currency.
 */
export class Account {
  constructor(
    public readonly id: string,
    private balance: number,
    public readonly currency: string
  ) {
    if (balance < 0) {
      throw new Error("Account balance cannot be negative");
    }
  }

  getBalance(): number {
    return this.balance;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }
    if (this.balance < amount) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  }
}
