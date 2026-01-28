# Multi-Currency Transfer Extension Design

## Overview
This document describes the design for extending the single-currency transfer system to support multi-currency transfers with exchange rates.

## Design Principles
1. **Isolation**: New functionality is completely isolated from existing code
2. **Non-breaking**: All existing behavior remains unchanged
3. **Invariant Preservation**: All monetary invariants are preserved
4. **Minimal Modification**: Only add new code, modify existing code only where strictly necessary

## Architecture

### New Components

#### 1. ExchangeRateService
**Purpose**: Provides exchange rate lookup and conversion functionality.

**Responsibilities**:
- Lookup exchange rates between currency pairs
- Convert amounts between currencies
- Handle exchange rate errors (missing rates, invalid currencies)

**Interface**:
```typescript
interface ExchangeRateService {
  getExchangeRate(fromCurrency: string, toCurrency: string): number;
  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number;
}
```

**Justification**: Centralizes exchange rate logic, making it testable and replaceable. Allows for future implementations (API-based, database-backed, etc.).

#### 2. MultiCurrencyTransferService
**Purpose**: Handles transfers between accounts with different currencies.

**Responsibilities**:
- Validate multi-currency transfer requests
- Use ExchangeRateService to convert amounts
- Execute transfers while preserving monetary invariants
- Record multi-currency transactions

**Interface**:
```typescript
class MultiCurrencyTransferService {
  transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number
  ): MultiCurrencyTransaction;
}
```

**Justification**: Isolated service ensures existing TransferService remains untouched. Follows single responsibility principle.

#### 3. MultiCurrencyTransaction
**Purpose**: Represents a transaction involving currency conversion.

**Properties**:
- Standard transaction fields (id, fromAccountId, toAccountId, timestamp)
- Source amount and currency
- Destination amount and currency
- Exchange rate used

**Justification**: Extends transaction model to capture exchange rate information for auditability and compliance.

### Modified Components

#### Account (No changes)
The existing `Account` class already supports currency as a property and handles deposits/withdrawals correctly. No modifications needed.

#### Transaction (No changes)
The existing `Transaction` class remains unchanged. Multi-currency transactions use a separate type.

### Integration Points

#### Minimal Modification Required
The only potential modification point is if we need to ensure `Account` currency validation is consistent. However, since `Account` already has currency as a property and the existing `TransferService` validates currency matching, no changes are needed.

## Data Flow

### Single-Currency Transfer (Existing - Unchanged)
```
User Request → TransferService.transfer() → Account.withdraw() → Account.deposit() → Transaction created
```

### Multi-Currency Transfer (New)
```
User Request → MultiCurrencyTransferService.transfer() 
  → ExchangeRateService.getExchangeRate() 
  → ExchangeRateService.convertAmount() 
  → Account.withdraw(amount in source currency) 
  → Account.deposit(converted amount in destination currency) 
  → MultiCurrencyTransaction created
```

## Invariant Preservation

### Monetary Invariants
1. **Balance Conservation**: In a multi-currency transfer, the value is preserved:
   - Source account: balance decreases by `amount` in source currency
   - Destination account: balance increases by `amount * exchangeRate` in destination currency
   - The monetary value (when converted to a common currency) is preserved

2. **No Negative Balances**: 
   - Withdrawal validation in Account class ensures balance cannot go negative
   - This invariant is preserved automatically

3. **Total Value Conservation**:
   - When both accounts are converted to a common currency, the total value remains constant
   - This is ensured by using the same exchange rate for the conversion

## Error Handling

### Exchange Rate Errors
- Missing exchange rate: Throw descriptive error
- Invalid currency: Validate before lookup
- Zero/negative exchange rate: Validate and reject

### Transfer Errors
- Insufficient funds: Handled by existing Account.withdraw() validation
- Currency validation: Explicit check in MultiCurrencyTransferService

## Testing Strategy

1. **Existing Tests**: All existing tests must continue to pass
2. **New Tests**: 
   - ExchangeRateService unit tests
   - MultiCurrencyTransferService unit tests
   - Integration tests for multi-currency transfers
   - Edge cases (rounding, precision, error handling)

## Implementation Order

1. Create ExchangeRateService with a simple in-memory implementation
2. Create MultiCurrencyTransaction type
3. Create MultiCurrencyTransferService
4. Add comprehensive tests
5. Verify existing tests still pass
