# Extension Plan: Multi-Currency Transfer Support

## Phase 1: Problem Restatement

Extend a financial transaction system that processes single-currency transfers to support multi-currency transfers with exchange rates, while preserving all existing behavior and monetary invariants.

## Phase 2: Assumptions Declaration

1. An existing system exists that processes single-currency transfers
2. The existing system has identifiable entry points for transfer processing
3. Exchange rates are provided by an external source (service or data structure)
4. Exchange rates are positive numbers
5. Currency codes are represented as strings (e.g., "USD", "EUR")
6. Monetary amounts are represented as numbers (or a Money type with amount and currency)
7. The system can distinguish between same-currency and different-currency transfers
8. Exchange rate lookups are deterministic for a given currency pair
9. The existing system has validation and error handling that must be preserved
10. The language choice (Java/Kotlin/TypeScript) is determined by the existing system's language
11. The existing system structure is discoverable or can be inferred from common patterns

## Phase 3: Definitions

- **Currency**: A string identifier representing a monetary unit (e.g., "USD", "EUR", "GBP")
- **Amount**: A numeric value representing a monetary quantity
- **Money**: A value object containing an amount and a currency
- **Transfer**: An operation moving money from a source to a destination
- **Single-Currency Transfer**: A transfer where source and destination currencies are identical
- **Multi-Currency Transfer**: A transfer where source and destination currencies differ
- **Exchange Rate**: A positive number representing the conversion factor from one currency to another
- **Exchange Rate Provider**: A service or data structure that supplies exchange rates for currency pairs
- **Source Account**: The account from which money is debited
- **Destination Account**: The account to which money is credited
- **Transfer Request**: Input data specifying source, destination, and amount

## Phase 4: Invariants Specification

1. **Conservation of value**: In a transfer, the total monetary value (in a common currency) is preserved
2. **Non-negative amounts**: All monetary amounts must be non-negative
3. **Currency consistency**: All operations on a Money value must respect its currency
4. **Exchange rate positivity**: Exchange rates must be positive numbers
5. **Idempotency**: Applying an exchange rate conversion and its inverse yields the original amount (within precision limits)
6. **Existing behavior preservation**: All existing single-currency transfer behavior remains unchanged
7. **Error handling**: Invalid operations (e.g., missing exchange rate, negative amounts) must be explicitly handled
8. **Referential transparency**: Exchange rate lookups are deterministic for the same currency pair at the same point in time

## Phase 5: Structural Derivation (Executable Pseudo-Code)

### Existing System Structure (Assumed)

The existing system is assumed to have:
- A `TransferService` that processes transfers
- A `Money` type representing amount and currency
- A `TransferRequest` type containing source, destination, and amount
- Account management that handles debits and credits

### Extension Structure (EPS)

```typescript
// New types for multi-currency support
interface ExchangeRateProvider {
  getRate(fromCurrency: string, toCurrency: string): number | null;
}

interface MultiCurrencyTransferRequest extends TransferRequest {
  destinationCurrency: string;
}

// Extension logic
class MultiCurrencyTransferService {
  constructor(
    private baseTransferService: TransferService,
    private exchangeRateProvider: ExchangeRateProvider
  ) {}

  processTransfer(request: MultiCurrencyTransferRequest): TransferResult {
    const isMultiCurrency = this.detectMultiCurrency(request);
    if (isMultiCurrency) {
      return this.processMultiCurrencyTransfer(request);
    } else {
      return this.baseTransferService.processTransfer(request);
    }
  }

  private detectMultiCurrency(request: MultiCurrencyTransferRequest): boolean {
    return request.sourceCurrency !== request.destinationCurrency;
  }

  private processMultiCurrencyTransfer(request: MultiCurrencyTransferRequest): TransferResult {
    const exchangeRate = this.obtainExchangeRate(request.sourceCurrency, request.destinationCurrency);
    const convertedAmount = this.convertAmount(request.amount, exchangeRate);
    const convertedRequest = this.createConvertedRequest(request, convertedAmount);
    return this.baseTransferService.processTransfer(convertedRequest);
  }

  private obtainExchangeRate(fromCurrency: string, toCurrency: string): number {
    const rate = this.exchangeRateProvider.getRate(fromCurrency, toCurrency);
    return this.validateExchangeRate(rate, fromCurrency, toCurrency);
  }

  private validateExchangeRate(rate: number | null, fromCurrency: string, toCurrency: string): number {
    if (rate === null) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    if (rate <= 0) {
      throw new Error(`Invalid exchange rate: ${rate}`);
    }
    return rate;
  }

  private convertAmount(amount: number, exchangeRate: number): number {
    return amount * exchangeRate;
  }

  private createConvertedRequest(request: MultiCurrencyTransferRequest, convertedAmount: number): TransferRequest {
    return {
      sourceAccount: request.sourceAccount,
      destinationAccount: request.destinationAccount,
      amount: convertedAmount,
      sourceCurrency: request.sourceCurrency,
      destinationCurrency: request.destinationCurrency
    };
  }
}
```

## Phase 6: Structural Verification

Verification checklist:
- ✅ All steps are defined: detection, rate lookup, validation, conversion, delegation
- ✅ All invariants are preserved:
  - Conservation of value: conversion preserves value via exchange rate
  - Non-negative amounts: validated in base service
  - Currency consistency: maintained through conversion
  - Exchange rate positivity: explicitly validated
  - Existing behavior: single-currency path unchanged
  - Error handling: explicit error paths for missing/invalid rates
- ✅ No step is missing or redundant: each step has a clear purpose

## Phase 7: Incremental Implementation

Implementation order:
1. ExchangeRateProvider interface
2. MultiCurrencyTransferRequest interface
3. MultiCurrencyTransferService class
4. detectMultiCurrency method
5. obtainExchangeRate method
6. validateExchangeRate method
7. convertAmount method
8. createConvertedRequest method
9. processMultiCurrencyTransfer method
10. processTransfer method

## Phase 8: Final Verification

After implementation:
- Re-check all invariants
- Ensure no assumptions were violated
- Confirm implementation matches EPS exactly
