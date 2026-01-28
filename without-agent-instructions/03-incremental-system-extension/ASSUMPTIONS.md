# Assumptions

## Exchange Rate Management
- Exchange rates are provided by an external service/provider
- Exchange rates can change over time, but are fixed at the time of transaction
- Exchange rates are always positive and non-zero
- The system does not need to handle historical exchange rate queries

## Currency Support
- The system supports standard 3-letter currency codes (ISO 4217)
- Currency codes are case-sensitive and must match exactly
- All supported currencies must have exchange rates available

## Transaction Invariants
- The monetary value of a transaction must be preserved (accounting for exchange rates)
- No account balance can become negative
- Exchange rate conversion may introduce rounding, which should be handled consistently
- The source account is debited in its currency, the destination account is credited in its currency

## System Behavior
- Multi-currency transfers are an extension - existing single-currency transfers continue to work unchanged
- The existing `TransferService` remains unchanged for backward compatibility
- New functionality is isolated in separate modules/services
- Exchange rate lookups may fail (network issues, unsupported currency pairs), which should be handled gracefully

## Rounding and Precision
- Exchange rate calculations may result in fractional amounts
- Rounding strategy: round to 2 decimal places for most currencies (standard financial precision)
- Rounding errors (if any) are absorbed by the system (not charged to either account)
