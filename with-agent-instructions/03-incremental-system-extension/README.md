# Multi-Currency Transfer Extension

## Overview

This extension adds multi-currency transfer support with exchange rates to an existing single-currency financial transaction system.

## Architecture

The extension follows a proof-oriented design methodology:

1. **Existing System** (`src/existing/`): The baseline single-currency transfer system
   - `TransferService`: Processes single-currency transfers
   - `TransferRequest`: Transfer request data structure
   - `TransferResult`: Transfer operation result
   - `Money`: Monetary value object

2. **Extension** (`src/extension/`): Multi-currency support
   - `MultiCurrencyTransferService`: Wraps existing service, adds multi-currency logic
   - `ExchangeRateProvider`: Interface for exchange rate lookups
   - `InMemoryExchangeRateProvider`: Sample implementation
   - `MultiCurrencyTransferRequest`: Extended request type

## Design Principles

- **Zero modification** of existing code
- **Logical isolation** of extension
- **Invariant preservation** (conservation of value, currency consistency, etc.)
- **Backward compatibility** (single-currency transfers unchanged)

## Usage

```typescript
import { TransferService } from "./existing/TransferService";
import {
  MultiCurrencyTransferService,
  InMemoryExchangeRateProvider,
} from "./extension";

// Create base service
const baseService = new TransferService();

// Create exchange rate provider
const rateProvider = new InMemoryExchangeRateProvider([
  { from: "USD", to: "EUR", rate: 0.85 },
  { from: "EUR", to: "USD", rate: 1.18 },
]);

// Create extended service
const multiCurrencyService = new MultiCurrencyTransferService(
  baseService,
  rateProvider,
);

// Process multi-currency transfer
const result = multiCurrencyService.processTransfer({
  sourceAccount: "ACC001",
  destinationAccount: "ACC002",
  amount: 100,
  sourceCurrency: "USD",
  destinationCurrency: "EUR",
});
```

## Verification

See `VERIFICATION.md` for complete invariant and assumption verification.

## Documentation

- `EXTENSION_PLAN.md`: Complete design derivation following proof-oriented methodology
- `VERIFICATION.md`: Final verification report
- `PATTERNS.md`: Comprehensive catalog of all design patterns, architectural patterns, and coding patterns used
- `AGENTS.md`: Proof-oriented coding constitution
