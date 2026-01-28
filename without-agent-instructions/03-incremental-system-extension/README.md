# Financial Transaction System

A financial transaction system that supports both single-currency and multi-currency transfers.

## Overview

This system was extended from a base single-currency transfer system to support multi-currency transfers with exchange rates. The extension maintains complete backward compatibility and preserves all monetary invariants.

## Structure

### Core Domain

- `Account`: Represents a financial account with a balance in a specific currency
- `Transaction`: Represents a single-currency transaction between accounts
- `MultiCurrencyTransaction`: Represents a multi-currency transaction with exchange rate information

### Services

- `TransferService`: Handles single-currency transfers (existing, unchanged)
- `MultiCurrencyTransferService`: Handles multi-currency transfers (new extension)
- `ExchangeRateService`: Provides exchange rate lookup and conversion (new)

## Usage

### Single-Currency Transfer (Existing)

```typescript
import { Account, TransferService } from "./src";

const transferService = new TransferService();
const account1 = new Account("acc-1", 1000, "USD");
const account2 = new Account("acc-2", 500, "USD");

const transaction = transferService.transfer(account1, account2, 200);
// account1 balance: 800 USD
// account2 balance: 700 USD
```

### Multi-Currency Transfer (New Extension)

```typescript
import {
  Account,
  MultiCurrencyTransferService,
  InMemoryExchangeRateService,
} from "./src";

const exchangeRateService = new InMemoryExchangeRateService();
const multiCurrencyService = new MultiCurrencyTransferService(
  exchangeRateService,
);

const usdAccount = new Account("acc-usd", 1000, "USD");
const eurAccount = new Account("acc-eur", 500, "EUR");

const transaction = multiCurrencyService.transfer(usdAccount, eurAccount, 100);
// usdAccount balance: 900 USD
// eurAccount balance: 585 EUR (100 USD * 0.85 exchange rate)
// transaction.sourceAmount: 100
// transaction.destinationAmount: 85
// transaction.exchangeRate: 0.85
```

## Design Principles

1. **Isolation**: New functionality is completely isolated from existing code
2. **Non-breaking**: All existing behavior remains unchanged
3. **Invariant Preservation**: All monetary invariants are preserved
4. **Minimal Modification**: Only new code added, existing code unchanged

## Testing

Run tests with:

```bash
npm test
```

All existing tests continue to pass, ensuring backward compatibility. New tests verify multi-currency functionality.

## Build

Build the project with:

```bash
npm run build
```

## Documentation

- `ASSUMPTIONS.md`: Assumptions made during design and implementation
- `EXTENSION_DESIGN.md`: Detailed design document for the multi-currency extension
- `DESIGN_PATTERNS.md`: Comprehensive catalog of all design patterns, architectural patterns, and principles used in the project
- `IMPLEMENTATION_SUMMARY.md`: Summary of the implementation and requirements verification
