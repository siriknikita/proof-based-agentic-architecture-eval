# Design Patterns Used in the Project

This document catalogs all design patterns, architectural patterns, and design principles applied in the financial transaction system.

## Quick Reference

| Pattern/Principle          | Category      | Location                          | Purpose                                     |
| -------------------------- | ------------- | --------------------------------- | ------------------------------------------- |
| Service Layer              | Architectural | `src/service/`                    | Separates business logic from domain        |
| Domain Model               | Architectural | `src/domain/`                     | Rich domain objects with behavior           |
| Strategy                   | Structural    | `ExchangeRateService.ts`          | Interchangeable exchange rate providers     |
| Dependency Injection       | Structural    | `MultiCurrencyTransferService.ts` | Loose coupling, testability                 |
| Factory (Implicit)         | Creational    | Transfer services                 | ID generation                               |
| Template Method (Implicit) | Behavioral    | Transfer services                 | Consistent transfer flow                    |
| Entity                     | DDD           | `Account.ts`                      | Objects with identity                       |
| Value Object               | DDD           | `Transaction.ts`                  | Immutable domain objects                    |
| Repository (Lightweight)   | DDD           | `TransferService.ts`              | Transaction storage                         |
| SRP                        | Principle     | All classes                       | Single responsibility                       |
| OCP                        | Principle     | Extension design                  | Open for extension, closed for modification |
| DIP                        | Principle     | `MultiCurrencyTransferService`    | Depend on abstractions                      |
| Guard Clauses              | Defensive     | All methods                       | Early validation                            |
| Immutability               | Defensive     | Domain objects                    | Prevent unintended changes                  |
| Extension by Addition      | Extension     | New services                      | Add without modifying                       |

## Table of Contents

1. [Architectural Patterns](#architectural-patterns)
2. [Creational Patterns](#creational-patterns)
3. [Structural Patterns](#structural-patterns)
4. [Behavioral Patterns](#behavioral-patterns)
5. [Design Principles](#design-principles)
6. [Domain-Driven Design Patterns](#domain-driven-design-patterns)

---

## Architectural Patterns

### 1. Service Layer Pattern

**Purpose**: Separates business logic from domain models and provides a clear API for operations.

**Implementation**:

- `TransferService`: Handles single-currency transfer operations
- `MultiCurrencyTransferService`: Handles multi-currency transfer operations
- `ExchangeRateService`: Handles exchange rate operations

**Location**: `src/service/`

**Benefits**:

- Encapsulates business logic
- Provides transaction coordination
- Maintains application-level invariants

**Example**:

```typescript
// TransferService coordinates the transfer operation
export class TransferService {
  transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: number,
  ): Transaction {
    // Validation, coordination, and transaction recording
  }
}
```

---

### 2. Domain Model Pattern

**Purpose**: Represents business concepts and their behavior as objects.

**Implementation**:

- `Account`: Encapsulates account state and behavior (deposit, withdraw)
- `Transaction`: Represents a financial transaction
- `MultiCurrencyTransaction`: Represents a multi-currency transaction

**Location**: `src/domain/`

**Benefits**:

- Rich domain models with behavior
- Encapsulation of business rules
- Self-documenting code

**Example**:

```typescript
export class Account {
  private balance: number;

  withdraw(amount: number): void {
    if (this.balance < amount) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  }
}
```

---

### 3. Layered Architecture

**Purpose**: Separates concerns into distinct layers.

**Structure**:

```
src/
├── domain/          # Domain layer (entities, value objects)
└── service/         # Service layer (application logic)
```

**Benefits**:

- Clear separation of concerns
- Easier testing and maintenance
- Reduced coupling

---

## Creational Patterns

### 4. Factory Pattern (Implicit)

**Purpose**: Encapsulates object creation logic.

**Implementation**:

- `generateTransactionId()` methods in transfer services
- Constructor-based creation of domain objects

**Location**:

- `TransferService.generateTransactionId()`
- `MultiCurrencyTransferService.generateTransactionId()`

**Example**:

```typescript
private generateTransactionId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## Structural Patterns

### 5. Strategy Pattern

**Purpose**: Defines a family of algorithms, encapsulates each one, and makes them interchangeable.

**Implementation**:

- `IExchangeRateService` interface defines the strategy
- `InMemoryExchangeRateService` is a concrete strategy
- Can be replaced with API-based, database-backed, or other implementations

**Location**: `src/service/ExchangeRateService.ts`

**Benefits**:

- Allows runtime selection of exchange rate provider
- Easy to add new implementations
- Testable with mock implementations

**Example**:

```typescript
export interface IExchangeRateService {
  getExchangeRate(fromCurrency: string, toCurrency: string): number;
  convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): number;
}

export class InMemoryExchangeRateService implements IExchangeRateService {
  // Concrete implementation
}
```

---

### 6. Dependency Injection

**Purpose**: Inverts control of dependencies, making code more testable and flexible.

**Implementation**:

- `MultiCurrencyTransferService` receives `IExchangeRateService` via constructor
- Dependencies are injected rather than created internally

**Location**: `src/service/MultiCurrencyTransferService.ts`

**Benefits**:

- Loose coupling
- Easy testing with mocks
- Flexible configuration

**Example**:

```typescript
export class MultiCurrencyTransferService {
  constructor(private exchangeRateService: IExchangeRateService) {}

  transfer(...) {
    const rate = this.exchangeRateService.getExchangeRate(...);
  }
}
```

---

### 7. Interface Segregation Principle

**Purpose**: Clients should not depend on interfaces they don't use.

**Implementation**:

- `IExchangeRateService` interface contains only methods needed by clients
- Focused, cohesive interface

**Location**: `src/service/ExchangeRateService.ts`

**Benefits**:

- Clear contracts
- Easy to understand and implement
- Prevents unnecessary dependencies

---

## Behavioral Patterns

### 8. Template Method Pattern (Implicit)

**Purpose**: Defines the skeleton of an algorithm, deferring some steps to subclasses.

**Implementation**:

- Both `TransferService` and `MultiCurrencyTransferService` follow similar transfer flow:
  1. Validate
  2. Check funds
  3. Perform transfer
  4. Record transaction

**Location**: Both transfer services

**Benefits**:

- Consistent algorithm structure
- Code reuse
- Easy to understand flow

**Example**:

```typescript
// Both services follow similar pattern:
transfer(...) {
  // 1. Validate
  // 2. Check funds
  // 3. Perform transfer (with currency conversion in multi-currency)
  // 4. Record transaction
}
```

---

### 9. Command Pattern (Implicit)

**Purpose**: Encapsulates a request as an object.

**Implementation**:

- `Transaction` and `MultiCurrencyTransaction` represent executed commands
- They record what was done and can be used for audit/replay

**Location**: `src/domain/Transaction.ts`, `src/domain/MultiCurrencyTransaction.ts`

**Benefits**:

- Audit trail
- Potential for undo/redo
- Decoupling of request from execution

---

## Design Principles

### 10. Single Responsibility Principle (SRP)

**Purpose**: A class should have only one reason to change.

**Implementation**:

- `Account`: Manages account balance only
- `TransferService`: Handles single-currency transfers only
- `MultiCurrencyTransferService`: Handles multi-currency transfers only
- `ExchangeRateService`: Handles exchange rates only

**Benefits**:

- Easier to understand
- Easier to test
- Easier to maintain

---

### 11. Open/Closed Principle (OCP)

**Purpose**: Software entities should be open for extension but closed for modification.

**Implementation**:

- Existing `TransferService` remains unchanged
- New `MultiCurrencyTransferService` extends functionality
- `IExchangeRateService` allows new implementations without modifying clients

**Benefits**:

- Backward compatibility
- Extensibility
- Reduced risk of breaking changes

**Example**:

```typescript
// Existing code unchanged
export class TransferService {
  /* unchanged */
}

// New extension
export class MultiCurrencyTransferService {
  /* new */
}
```

---

### 12. Liskov Substitution Principle (LSP)

**Purpose**: Objects of a superclass should be replaceable with objects of its subclasses.

**Implementation**:

- Any implementation of `IExchangeRateService` can replace `InMemoryExchangeRateService`
- `MultiCurrencyTransaction.toTransaction()` allows substitution

**Example**:

```typescript
// Any IExchangeRateService implementation works
const service1 = new InMemoryExchangeRateService();
const service2 = new ApiExchangeRateService(); // hypothetical
// Both can be used interchangeably
```

---

### 13. Dependency Inversion Principle (DIP)

**Purpose**: Depend on abstractions, not concretions.

**Implementation**:

- `MultiCurrencyTransferService` depends on `IExchangeRateService` interface, not concrete class
- High-level modules don't depend on low-level modules

**Benefits**:

- Flexibility
- Testability
- Loose coupling

---

### 14. Interface Segregation Principle (ISP)

**Purpose**: Many client-specific interfaces are better than one general-purpose interface.

**Implementation**:

- `IExchangeRateService` is focused and specific
- No methods that clients don't need

---

### 15. Don't Repeat Yourself (DRY)

**Purpose**: Avoid code duplication.

**Implementation**:

- Validation logic patterns (though not extracted to avoid modification)
- Similar structure in transfer services (by design, not refactored)

---

## Domain-Driven Design Patterns

### 16. Entity Pattern

**Purpose**: Objects with unique identity that persist over time.

**Implementation**:

- `Account`: Has unique `id`, state changes over time (balance)
- `Transaction`: Has unique `id`, immutable after creation

**Location**: `src/domain/Account.ts`, `src/domain/Transaction.ts`

**Characteristics**:

- Identity-based equality
- Mutable state (for Account)
- Lifecycle management

---

### 17. Value Object Pattern

**Purpose**: Objects defined by their attributes, not identity.

**Implementation**:

- `Transaction`: Immutable, defined by its properties
- `MultiCurrencyTransaction`: Immutable, defined by its properties

**Location**: `src/domain/Transaction.ts`, `src/domain/MultiCurrencyTransaction.ts`

**Characteristics**:

- Immutable
- Value-based equality
- No identity field (though has `id` for tracking)

**Example**:

```typescript
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly fromAccountId: string,
    public readonly toAccountId: string,
    public readonly amount: number,
    public readonly timestamp: Date = new Date(),
  ) {
    // Immutable after construction
  }
}
```

---

### 18. Repository Pattern (Lightweight)

**Purpose**: Abstracts data access and provides collection-like interface.

**Implementation**:

- `TransferService.getTransactions()`: Provides access to stored transactions
- Lightweight in-memory storage

**Location**: `src/service/TransferService.ts`

**Example**:

```typescript
export class TransferService {
  private transactions: Transaction[] = [];

  getTransactions(): readonly Transaction[] {
    return [...this.transactions];
  }
}
```

---

### 19. Aggregate Pattern (Implicit)

**Purpose**: Cluster of domain objects treated as a single unit.

**Implementation**:

- `Account` is the aggregate root
- Transactions reference accounts but are separate aggregates

**Benefits**:

- Consistency boundaries
- Transaction management

---

## Defensive Programming Patterns

### 20. Guard Clauses

**Purpose**: Early validation and return to reduce nesting.

**Implementation**:

- All methods validate inputs early
- Throw errors immediately on invalid input

**Example**:

```typescript
withdraw(amount: number): void {
  if (amount <= 0) {
    throw new Error("Withdrawal amount must be positive");
  }
  if (this.balance < amount) {
    throw new Error("Insufficient funds");
  }
  this.balance -= amount;
}
```

---

### 21. Fail-Fast Principle

**Purpose**: Detect errors as early as possible.

**Implementation**:

- Constructor validation
- Method parameter validation
- Pre-condition checks

**Example**:

```typescript
constructor(
  public readonly id: string,
  private balance: number,
  public readonly currency: string
) {
  if (balance < 0) {
    throw new Error("Account balance cannot be negative");
  }
}
```

---

### 22. Immutability Pattern

**Purpose**: Prevent unintended state changes.

**Implementation**:

- `readonly` properties in domain objects
- Immutable `Transaction` and `MultiCurrencyTransaction`
- Defensive copying in `getTransactions()`

**Example**:

```typescript
export class Account {
  public readonly id: string;
  public readonly currency: string;
  // balance is private and only changed through controlled methods
}

getTransactions(): readonly Transaction[] {
  return [...this.transactions]; // Defensive copy
}
```

---

## Extension Patterns

### 23. Extension by Addition

**Purpose**: Add new functionality without modifying existing code.

**Implementation**:

- New `MultiCurrencyTransferService` instead of modifying `TransferService`
- New `MultiCurrencyTransaction` instead of modifying `Transaction`
- New `ExchangeRateService` as separate concern

**Benefits**:

- Zero risk to existing functionality
- Clear separation
- Easy to understand what's new vs. existing

---

### 24. Adapter Pattern (Potential)

**Purpose**: Allows incompatible interfaces to work together.

**Implementation**:

- `MultiCurrencyTransaction.toTransaction()` adapts to base `Transaction` interface

**Location**: `src/domain/MultiCurrencyTransaction.ts`

**Example**:

```typescript
toTransaction(): Transaction {
  return new Transaction(
    this.id,
    this.fromAccountId,
    this.toAccountId,
    this.sourceAmount,
    this.timestamp
  );
}
```

---

## Summary

The project employs a comprehensive set of design patterns and principles:

**Architectural**: Service Layer, Domain Model, Layered Architecture

**Creational**: Factory (implicit)

**Structural**: Strategy, Dependency Injection, Interface Segregation

**Behavioral**: Template Method (implicit), Command (implicit)

**DDD**: Entity, Value Object, Repository (lightweight), Aggregate (implicit)

**Principles**: SRP, OCP, LSP, DIP, ISP, DRY

**Defensive**: Guard Clauses, Fail-Fast, Immutability

**Extension**: Extension by Addition, Adapter

These patterns work together to create a maintainable, testable, and extensible system that preserves existing behavior while adding new functionality.
