import { MultiCurrencyTransaction } from "../MultiCurrencyTransaction";

describe("MultiCurrencyTransaction", () => {
  it("should create a valid multi-currency transaction", () => {
    const transaction = new MultiCurrencyTransaction(
      "txn-1",
      "acc-1",
      "acc-2",
      100,
      "USD",
      85,
      "EUR",
      0.85
    );

    expect(transaction.id).toBe("txn-1");
    expect(transaction.fromAccountId).toBe("acc-1");
    expect(transaction.toAccountId).toBe("acc-2");
    expect(transaction.sourceAmount).toBe(100);
    expect(transaction.sourceCurrency).toBe("USD");
    expect(transaction.destinationAmount).toBe(85);
    expect(transaction.destinationCurrency).toBe("EUR");
    expect(transaction.exchangeRate).toBe(0.85);
  });

  it("should reject transaction with same currency", () => {
    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        100,
        "USD",
        100,
        "USD",
        1.0
      );
    }).toThrow("MultiCurrencyTransaction requires different currencies");
  });

  it("should reject transaction with zero or negative source amount", () => {
    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        0,
        "USD",
        0,
        "EUR",
        0.85
      );
    }).toThrow("Source amount must be positive");

    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        -100,
        "USD",
        -85,
        "EUR",
        0.85
      );
    }).toThrow("Source amount must be positive");
  });

  it("should reject transaction with zero or negative destination amount", () => {
    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        100,
        "USD",
        0,
        "EUR",
        0.85
      );
    }).toThrow("Destination amount must be positive");
  });

  it("should reject transaction with zero or negative exchange rate", () => {
    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        100,
        "USD",
        85,
        "EUR",
        0
      );
    }).toThrow("Exchange rate must be positive");

    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-2",
        100,
        "USD",
        85,
        "EUR",
        -1
      );
    }).toThrow("Exchange rate must be positive");
  });

  it("should reject transaction to the same account", () => {
    expect(() => {
      new MultiCurrencyTransaction(
        "txn-1",
        "acc-1",
        "acc-1",
        100,
        "USD",
        85,
        "EUR",
        0.85
      );
    }).toThrow("Cannot transfer to the same account");
  });

  it("should convert to base Transaction", () => {
    const mctxn = new MultiCurrencyTransaction(
      "txn-1",
      "acc-1",
      "acc-2",
      100,
      "USD",
      85,
      "EUR",
      0.85
    );

    const txn = mctxn.toTransaction();
    expect(txn.id).toBe("txn-1");
    expect(txn.fromAccountId).toBe("acc-1");
    expect(txn.toAccountId).toBe("acc-2");
    expect(txn.amount).toBe(100); // Uses source amount
  });
});
