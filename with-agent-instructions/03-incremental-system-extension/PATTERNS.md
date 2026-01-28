# Design Patterns and Architectural Patterns Used in the Project

This document catalogs all design patterns, architectural patterns, coding patterns, and principles used throughout the codebase.

---

## 1. Design Patterns (Gang of Four)

### 1.1 Decorator Pattern

**Location**: `MultiCurrencyTransferService`

**Description**: The `MultiCurrencyTransferService` wraps the existing `TransferService` to add multi-currency functionality without modifying the base service.

**Implementation**:

```typescript
export class MultiCurrencyTransferService {
  constructor(
    private baseTransferService: TransferService,
    private exchangeRateProvider: ExchangeRateProvider,
  ) {}

  processTransfer(request: MultiCurrencyTransferRequest): TransferResult {
    // Decorates base service with multi-currency logic
    if (isMultiCurrency) {
      return this.processMultiCurrencyTransfer(request);
    } else {
      return this.baseTransferService.processTransfer(request);
    }
  }
}
```

**Benefits**:

- Extends functionality without modifying existing code
- Preserves backward compatibility
- Follows Open/Closed Principle

---

### 1.2 Strategy Pattern

**Location**: `ExchangeRateProvider` interface and implementations

**Description**: The `ExchangeRateProvider` interface defines a family of exchange rate lookup algorithms. Different implementations (in-memory, API-based, database-backed) can be swapped at runtime.

**Implementation**:

```typescript
export interface ExchangeRateProvider {
  getRate(fromCurrency: string, toCurrency: string): number | null;
}

export class InMemoryExchangeRateProvider implements ExchangeRateProvider {
  // Strategy implementation
}
```

**Benefits**:

- Encapsulates exchange rate lookup algorithms
- Allows runtime strategy selection
- Easy to add new implementations

---

### 1.3 Adapter Pattern

**Location**: `createConvertedRequest` method in `MultiCurrencyTransferService`

**Description**: Adapts a multi-currency transfer request into a single-currency request that the existing service can process.

**Implementation**:

```typescript
private createConvertedRequest(
  request: MultiCurrencyTransferRequest,
  convertedAmount: number
): TransferRequest {
  return {
    sourceAccount: request.sourceAccount,
    destinationAccount: request.destinationAccount,
    amount: convertedAmount,
    sourceCurrency: request.destinationCurrency,
    destinationCurrency: request.destinationCurrency
  };
}
```

**Benefits**:

- Enables incompatible interfaces to work together
- Allows reuse of existing service without modification
- Maintains interface compatibility

---

### 1.4 Template Method Pattern

**Location**: `processMultiCurrencyTransfer` method

**Description**: Defines the skeleton of the multi-currency transfer algorithm, with specific steps (rate lookup, conversion, delegation) that follow a fixed sequence.

**Implementation**:

```typescript
private processMultiCurrencyTransfer(request: MultiCurrencyTransferRequest): TransferResult {
  const exchangeRate = this.obtainExchangeRate(...);      // Step 1
  const convertedAmount = this.convertAmount(...);        // Step 2
  const convertedRequest = this.createConvertedRequest(...); // Step 3
  return this.baseTransferService.processTransfer(...);    // Step 4
}
```

**Benefits**:

- Defines invariant parts of algorithm
- Allows sub-steps to vary in implementation
- Ensures consistent execution flow

---

### 1.5 Facade Pattern

**Location**: `MultiCurrencyTransferService.processTransfer`

**Description**: Provides a simplified interface to the complex subsystem (exchange rate lookup, conversion, base service).

**Implementation**:

```typescript
processTransfer(request: MultiCurrencyTransferRequest): TransferResult {
  // Simplifies complex multi-currency processing
  const isMultiCurrency = this.detectMultiCurrency(request);
  if (isMultiCurrency) {
    return this.processMultiCurrencyTransfer(request);
  } else {
    return this.baseTransferService.processTransfer(request);
  }
}
```

**Benefits**:

- Hides complexity of multi-currency processing
- Provides single entry point
- Simplifies client usage

---

## 2. Architectural Patterns

### 2.1 Extension Pattern

**Location**: Entire extension module (`src/extension/`)

**Description**: Extends system functionality without modifying existing code. The extension is logically isolated and can be added/removed without affecting the base system.

**Structure**:

```
src/
  existing/     # Base system (unchanged)
  extension/    # Extension (new functionality)
```

**Benefits**:

- Zero modification of existing code
- Clear separation of concerns
- Easy to test and maintain

---

### 2.2 Wrapper Pattern

**Location**: `MultiCurrencyTransferService`

**Description**: Wraps the existing `TransferService` to add new capabilities while preserving original behavior.

**Benefits**:

- Non-invasive extension
- Backward compatibility
- Composition over inheritance

---

### 2.3 Service Layer Pattern

**Location**: `TransferService`, `MultiCurrencyTransferService`

**Description**: Business logic is encapsulated in service classes that coordinate domain objects and external services.

**Structure**:

- Service classes contain business logic
- Domain objects (Money) represent domain concepts
- Services coordinate operations

**Benefits**:

- Clear separation of business logic
- Reusable service components
- Testable business operations

---

### 2.4 Dependency Injection

**Location**: Constructor injection in `MultiCurrencyTransferService`

**Description**: Dependencies (`TransferService`, `ExchangeRateProvider`) are injected via constructor rather than created internally.

**Implementation**:

```typescript
constructor(
  private baseTransferService: TransferService,
  private exchangeRateProvider: ExchangeRateProvider
) {}
```

**Benefits**:

- Loose coupling
- Testability (easy to mock dependencies)
- Flexibility (different implementations can be injected)

---

### 2.5 Separation of Concerns

**Location**: Directory structure and class organization

**Description**: Different concerns (existing system, extension, domain models) are separated into distinct modules.

**Structure**:

- `existing/`: Base system
- `extension/`: New functionality
- Domain models: Value objects

**Benefits**:

- Clear module boundaries
- Independent evolution
- Reduced coupling

---

## 3. Domain-Driven Design Patterns

### 3.1 Value Object Pattern

**Location**: `Money` class

**Description**: `Money` is an immutable value object that represents a domain concept with no identity, only value.

**Implementation**:

```typescript
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    // Validation in constructor
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

**Characteristics**:

- Immutable (readonly properties)
- Validated on creation
- Equality by value
- No identity

**Benefits**:

- Prevents invalid states
- Thread-safe
- Clear domain semantics

---

### 3.2 Domain Service Pattern

**Location**: `TransferService`, `MultiCurrencyTransferService`

**Description**: Services that contain domain logic that doesn't naturally fit within a single entity or value object.

**Benefits**:

- Encapsulates cross-cutting domain logic
- Coordinates multiple domain objects
- Represents domain operations

---

### 3.3 Repository Pattern (Implicit)

**Location**: `ExchangeRateProvider` interface

**Description**: While not a full repository, `ExchangeRateProvider` abstracts data access for exchange rates, similar to repository pattern.

**Benefits**:

- Decouples data access from business logic
- Easy to swap implementations
- Testable with in-memory implementations

---

## 4. SOLID Principles

### 4.1 Single Responsibility Principle (SRP)

**Examples**:

- `TransferService`: Handles single-currency transfers only
- `MultiCurrencyTransferService`: Handles multi-currency logic only
- `ExchangeRateProvider`: Provides exchange rates only
- `Money`: Represents monetary value only

**Benefits**: Each class has one reason to change, making code more maintainable.

---

### 4.2 Open/Closed Principle (OCP)

**Location**: Extension design

**Description**: System is open for extension (multi-currency support) but closed for modification (existing code unchanged).

**Implementation**: Extension wraps existing service without modifying it.

**Benefits**: System can be extended without risk to existing functionality.

---

### 4.3 Liskov Substitution Principle (LSP)

**Location**: `MultiCurrencyTransferRequest extends TransferRequest`

**Description**: `MultiCurrencyTransferRequest` can be used anywhere `TransferRequest` is expected, maintaining behavioral compatibility.

**Benefits**: Type safety and substitutability.

---

### 4.4 Interface Segregation Principle (ISP)

**Location**: `ExchangeRateProvider` interface

**Description**: Interface is focused and contains only methods needed by clients.

**Implementation**:

```typescript
export interface ExchangeRateProvider {
  getRate(fromCurrency: string, toCurrency: string): number | null;
}
```

**Benefits**: Clients depend only on methods they use, reducing coupling.

---

### 4.5 Dependency Inversion Principle (DIP)

**Location**: `MultiCurrencyTransferService` depends on `ExchangeRateProvider` interface, not concrete implementations.

**Description**: High-level modules depend on abstractions (interfaces), not concrete implementations.

**Benefits**: Flexibility to swap implementations, easier testing.

---

## 5. Coding Patterns

### 5.1 Immutability Pattern

**Location**: `Money` class, readonly properties

**Description**: Value objects use readonly properties to prevent mutation after creation.

**Implementation**:

```typescript
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}
}
```

**Benefits**: Thread-safety, predictable behavior, prevents accidental mutations.

---

### 5.2 Fail-Fast Validation

**Location**: Constructor validation in `Money`, `validateExchangeRate`

**Description**: Validation occurs immediately upon object creation or operation, failing fast with clear error messages.

**Implementation**:

```typescript
constructor(public readonly amount: number, public readonly currency: string) {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }
  if (!currency || currency.trim() === "") {
    throw new Error("Currency must be specified");
  }
}
```

**Benefits**: Prevents invalid states, clear error messages, early detection of problems.

---

### 5.3 Guard Clauses

**Location**: `TransferService.processTransfer`, `validateExchangeRate`

**Description**: Early returns for error conditions, making code more readable.

**Implementation**:

```typescript
if (request.sourceCurrency !== request.destinationCurrency) {
  return { success: false, message: "..." };
}
// Continue with normal flow
```

**Benefits**: Reduces nesting, improves readability, clear error paths.

---

### 5.4 Pipeline Pattern

**Location**: `processMultiCurrencyTransfer` method

**Description**: Sequential transformation of data through a series of operations.

**Implementation**:

```typescript
const exchangeRate = this.obtainExchangeRate(...);
const convertedAmount = this.convertAmount(...);
const convertedRequest = this.createConvertedRequest(...);
return this.baseTransferService.processTransfer(...);
```

**Benefits**: Clear data flow, easy to understand transformation steps, composable operations.

---

### 5.5 Null Safety Pattern

**Location**: `ExchangeRateProvider.getRate` returns `number | null`, nullish coalescing in `InMemoryExchangeRateProvider`

**Description**: Explicit handling of nullable values with clear null semantics.

**Implementation**:

```typescript
getRate(fromCurrency: string, toCurrency: string): number | null {
  const key = `${fromCurrency}_${toCurrency}`;
  return this.rates.get(key) ?? null;  // Nullish coalescing
}
```

**Benefits**: Type safety, explicit null handling, prevents null pointer exceptions.

---

### 5.6 Type Safety Pattern

**Location**: TypeScript interfaces, type extensions

**Description**: Strong typing throughout the codebase prevents type-related errors.

**Implementation**:

```typescript
export interface MultiCurrencyTransferRequest extends TransferRequest {
  // Type-safe extension
}
```

**Benefits**: Compile-time error detection, better IDE support, self-documenting code.

---

## 6. TypeScript-Specific Patterns

### 6.1 Interface-Based Design

**Location**: `ExchangeRateProvider`, `TransferRequest`, `TransferResult`

**Description**: Heavy use of interfaces for contracts and abstractions.

**Benefits**: Loose coupling, easy mocking, clear contracts.

---

### 6.2 Type Extensions

**Location**: `MultiCurrencyTransferRequest extends TransferRequest`

**Description**: Extending interfaces to create specialized types.

**Benefits**: Type safety, code reuse, clear type relationships.

---

### 6.3 Optional Parameters

**Location**: `InMemoryExchangeRateProvider` constructor

**Description**: Using optional parameters for flexible object construction.

**Implementation**:

```typescript
constructor(initialRates?: Array<{ from: string; to: string; rate: number }>) {
  // Optional parameter
}
```

**Benefits**: Flexible APIs, backward compatibility.

---

### 6.4 Readonly Properties

**Location**: `Money` class, constructor parameters

**Description**: Using `readonly` modifier to enforce immutability.

**Benefits**: Immutability guarantees, prevents accidental mutations.

---

### 6.5 Nullish Coalescing

**Location**: `InMemoryExchangeRateProvider.getRate`

**Description**: Using `??` operator for null/undefined handling.

**Implementation**:

```typescript
return this.rates.get(key) ?? null;
```

**Benefits**: Cleaner null handling, explicit default values.

---

## 7. Error Handling Patterns

### 7.1 Explicit Error Handling

**Location**: `validateExchangeRate`, constructor validations

**Description**: Errors are explicitly thrown with descriptive messages rather than silently failing.

**Implementation**:

```typescript
if (rate === null) {
  throw new Error(
    `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
  );
}
```

**Benefits**: Clear error messages, easier debugging, predictable failure modes.

---

### 7.2 Result Pattern (Implicit)

**Location**: `TransferResult` interface

**Description**: Operations return result objects indicating success/failure rather than throwing exceptions for business logic failures.

**Implementation**:

```typescript
export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
}
```

**Benefits**: Explicit success/failure handling, no exception overhead for expected failures.

---

## 8. Methodology Patterns

### 8.1 Proof-Oriented Design

**Location**: Entire project structure, `EXTENSION_PLAN.md`

**Description**: Following a rigorous derivation process: Problem Restatement → Assumptions → Definitions → Invariants → Structural Derivation → Verification → Implementation.

**Benefits**:

- Correctness by construction
- Clear reasoning trail
- Verifiable design

---

### 8.2 Incremental Implementation

**Location**: Implementation order in `EXTENSION_PLAN.md`

**Description**: Implementing one unit (class, method, function) at a time, following strict refinement rules.

**Benefits**:

- Controlled complexity
- Easy to verify each step
- Clear progress tracking

---

### 8.3 Structural Derivation (EPS)

**Location**: `EXTENSION_PLAN.md` Phase 5

**Description**: Creating Executable Pseudo-Code Skeleton (EPS) that defines structure before implementation.

**Benefits**:

- Structure precedes implementation
- Clear architectural decisions
- Immutable design reference

---

## 9. Data Structure Patterns

### 9.1 Map-Based Storage

**Location**: `InMemoryExchangeRateProvider` uses `Map<string, number>`

**Description**: Using Map data structure for key-value storage with O(1) lookup.

**Implementation**:

```typescript
private rates: Map<string, number> = new Map();
const key = `${fromCurrency}_${toCurrency}`;
this.rates.set(key, rate);
```

**Benefits**: Efficient lookups, type-safe key-value pairs, clear semantics.

---

### 9.2 Composite Key Pattern

**Location**: Exchange rate key generation

**Description**: Creating composite keys from multiple values for map storage.

**Implementation**:

```typescript
const key = `${fromCurrency}_${toCurrency}`;
```

**Benefits**: Single-key lookup for multi-value queries, efficient storage.

---

## 10. Validation Patterns

### 10.1 Constructor Validation

**Location**: `Money` class constructor

**Description**: Validating invariants at object creation time.

**Benefits**: Impossible to create invalid objects, fail-fast behavior.

---

### 10.2 Method-Level Validation

**Location**: `validateExchangeRate`, `setRate`

**Description**: Validating inputs at method boundaries.

**Benefits**: Defensive programming, clear validation points, consistent error handling.

---

## Summary

This project employs a comprehensive set of patterns:

- **Design Patterns**: Decorator, Strategy, Adapter, Template Method, Facade
- **Architectural Patterns**: Extension, Wrapper, Service Layer, Dependency Injection
- **DDD Patterns**: Value Object, Domain Service, Repository (implicit)
- **SOLID Principles**: All five principles applied throughout
- **Coding Patterns**: Immutability, Fail-Fast, Guard Clauses, Pipeline, Null Safety
- **TypeScript Patterns**: Interface-based design, type extensions, readonly properties
- **Error Handling**: Explicit errors, Result pattern
- **Methodology**: Proof-oriented design, incremental implementation

These patterns work together to create a maintainable, extensible, and correct system that preserves existing behavior while adding new functionality.
