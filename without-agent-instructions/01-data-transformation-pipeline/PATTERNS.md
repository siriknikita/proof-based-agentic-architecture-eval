# Design Patterns Used in This Project

This document catalogs all design patterns, architectural patterns, and coding patterns used throughout the data transformation pipeline codebase.

## Table of Contents

1. [Architectural Patterns](#architectural-patterns)
2. [Design Patterns](#design-patterns)
3. [Functional Programming Patterns](#functional-programming-patterns)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Type System Patterns](#type-system-patterns)
6. [Data Processing Patterns](#data-processing-patterns)
7. [Code Organization Patterns](#code-organization-patterns)

---

## Architectural Patterns

### 1. Pipeline Pattern

**Location:** `src/pipeline.ts`, `src/stages/*.ts`

**Description:** The core architectural pattern where data flows through a series of transformation stages. Each stage processes input and produces output for the next stage.

**Implementation:**

```typescript
// Data flows: Raw → Sanitized → Validated → Deduplicated → Ordered
sanitize() → validate() → deduplicate() → order()
```

**Benefits:**

- Clear separation of concerns
- Easy to test each stage independently
- Simple to add/remove/reorder stages
- Composable transformations

**Usage:**

```typescript
const pipeline = new DataTransformationPipeline();
const result = pipeline.process(rawRecords);
```

---

### 2. Layered Architecture

**Location:** Throughout the codebase

**Description:** The system is organized in layers:

- **Type Layer** (`types.ts`): Type definitions
- **Stage Layer** (`stages/*.ts`): Individual transformations
- **Orchestration Layer** (`pipeline.ts`): Coordinates stages
- **Application Layer** (`example.ts`): Usage examples

**Benefits:**

- Clear separation of concerns
- Easy to understand system structure
- Promotes reusability

---

## Design Patterns

### 3. Result/Either Pattern (Discriminated Union)

**Location:** `src/types.ts` - `PipelineResult<T>`

**Description:** A functional programming pattern for explicit error handling without exceptions. Functions return either success data or an error, never both.

**Implementation:**

```typescript
export type PipelineResult<T> =
  | { success: true; data: T }
  | { success: false; error: PipelineError };
```

**Benefits:**

- Explicit error handling (no silent failures)
- Type-safe error handling
- Forces callers to handle errors
- No exception throwing/catching overhead

**Usage:**

```typescript
const result = sanitize(rawRecord);
if (result.success) {
  // TypeScript knows result.data is available
  process(result.data);
} else {
  // TypeScript knows result.error is available
  handleError(result.error);
}
```

---

### 4. Strategy Pattern

**Location:** `src/pipeline.ts` - `VendorHandler`

**Description:** Encapsulates vendor-specific algorithms (pre-processing and post-processing) and makes them interchangeable without modifying the core pipeline logic.

**Implementation:**

```typescript
export interface VendorHandler {
  preProcess?(record: RawVendorRecord): RawVendorRecord;
  postProcess?(record: CanonicalRecord): CanonicalRecord;
}
```

**Benefits:**

- Extensibility without modifying core code
- Open/Closed Principle compliance
- Easy to add new vendor-specific logic
- Testable in isolation

**Usage:**

```typescript
const vendorHandlers = new Map([
  [
    "vendor-1",
    {
      preProcess: (record) => normalizeFields(record),
      postProcess: (record) => addVendorMetadata(record),
    },
  ],
]);
```

---

### 5. Chain of Responsibility Pattern

**Location:** `src/pipeline.ts` - `process()` method

**Description:** Each stage in the pipeline is a handler that processes the request (record) and passes it to the next handler. If a stage fails, the chain can be broken or continued based on configuration.

**Implementation:**

```typescript
// Each stage processes and passes to next
sanitize → validate → deduplicate → order
```

**Benefits:**

- Decouples sender from receiver
- Dynamic chain composition
- Can stop or continue on errors
- Easy to add/remove handlers

---

### 6. Template Method Pattern

**Location:** `src/pipeline.ts` - `DataTransformationPipeline` class

**Description:** The pipeline class defines the skeleton of the algorithm (the sequence of stages) while allowing sub-steps to vary (vendor handlers, error handling strategy).

**Implementation:**

```typescript
class DataTransformationPipeline {
  process(records) {
    // Template: defines the algorithm structure
    for (record of records) {
      preProcess(record); // Variable step
      sanitize(record); // Fixed step
      validate(record); // Fixed step
      // ...
      postProcess(record); // Variable step
    }
    deduplicate(records); // Fixed step
    order(records); // Fixed step
  }
}
```

**Benefits:**

- Code reuse
- Consistent algorithm structure
- Flexible customization points
- Easy to understand flow

---

### 7. Factory Pattern

**Location:** `src/pipeline.ts` - Constructor

**Description:** The pipeline constructor acts as a factory that creates configured pipeline instances with different behaviors (error handling, vendor handlers).

**Implementation:**

```typescript
const pipeline = new DataTransformationPipeline({
  continueOnError: true,
  vendorHandlers: new Map([...])
});
```

**Benefits:**

- Encapsulates object creation
- Flexible configuration
- Consistent initialization
- Easy to create variations

---

### 8. Adapter Pattern

**Location:** `src/stages/sanitize.ts` - Field name normalization

**Description:** Adapts different vendor field name conventions to a common interface. Handles `productId`, `product_id`, `id` → `productId`.

**Implementation:**

```typescript
const productId = sanitizeString(
  rawRecord.productId ?? rawRecord.product_id ?? rawRecord.id,
);
```

**Benefits:**

- Tolerant of different input formats
- Single interface for downstream code
- No pre-processing required
- Easy to extend with new field name variants

---

### 9. Guard Pattern

**Location:** `src/stages/validate.ts`

**Description:** Early validation checks that guard against invalid data, returning errors immediately if conditions aren't met.

**Implementation:**

```typescript
if (!/^[a-zA-Z0-9_-]+$/.test(sanitized.productId)) {
  return createError("validate", sanitized, "Invalid productId format");
}
// Continue processing only if guard passes
```

**Benefits:**

- Fail fast
- Clear error messages
- Prevents invalid data propagation
- Easy to understand validation logic

---

### 10. Null Object Pattern

**Location:** `src/pipeline.ts` - Optional vendor handlers

**Description:** Uses optional chaining and default behavior instead of null checks, providing a "do nothing" default when handlers are absent.

**Implementation:**

```typescript
const handler = this.config.vendorHandlers.get(vendorId);
const preProcessedRecord = handler?.preProcess
  ? handler.preProcess(rawRecord)
  : rawRecord; // Default: no transformation
```

**Benefits:**

- Eliminates null checks
- Cleaner code
- Safe defaults
- No special cases needed

---

## Functional Programming Patterns

### 11. Pure Functions

**Location:** All stage functions (`sanitize`, `validate`, `deduplicate`, `order`)

**Description:** Stage functions are pure - they have no side effects and always return the same output for the same input.

**Implementation:**

```typescript
export function sanitize(
  rawRecord: RawVendorRecord,
): PipelineResult<SanitizedRecord> {
  // No side effects, only input → output transformation
  return { success: true, data: sanitized };
}
```

**Benefits:**

- Testable (no mocking needed)
- Predictable behavior
- Thread-safe
- Easy to reason about
- Deterministic (required for this project)

---

### 12. Immutability Pattern

**Location:** `src/stages/order.ts`, `src/stages/deduplicate.ts`

**Description:** Functions don't mutate input data, creating new objects/arrays instead.

**Implementation:**

```typescript
// Create a copy to avoid mutating the input
const ordered = [...records];
ordered.sort(...);
return { success: true, data: ordered };
```

**Benefits:**

- No unexpected mutations
- Easier debugging
- Thread-safe
- Predictable behavior
- Supports functional composition

---

### 13. Higher-Order Functions

**Location:** `src/pipeline.ts` - `processStream()`, array methods

**Description:** Functions that take other functions as parameters or return functions.

**Implementation:**

```typescript
const finalRecords = orderedRecords.map((record) => {
  const handler = this.config.vendorHandlers.get(record.vendorId);
  return handler?.postProcess ? handler.postProcess(record) : record;
});
```

**Benefits:**

- Code reuse
- Declarative code
- Composable transformations
- Functional style

---

### 14. Function Composition

**Location:** `src/pipeline.ts` - Stage chaining

**Description:** Combining simple functions to build complex transformations.

**Implementation:**

```typescript
// Compose: sanitize ∘ validate ∘ deduplicate ∘ order
const sanitized = sanitize(record);
const validated = validate(sanitized.data);
const deduplicated = deduplicate([validated.data]);
const ordered = order(deduplicated.data);
```

**Benefits:**

- Modular transformations
- Easy to test
- Clear data flow
- Reusable components

---

## Error Handling Patterns

### 15. Error Accumulation Pattern

**Location:** `src/pipeline.ts` - `process()` method

**Description:** Collects all errors during processing instead of failing on first error, allowing complete error reporting.

**Implementation:**

```typescript
const errors: PipelineError[] = [];
// ...
if (!sanitizeResult.success) {
  errors.push(sanitizeResult.error);
  if (!this.config.continueOnError) break;
  continue;
}
```

**Benefits:**

- Complete error visibility
- No silent failures
- Better debugging
- Can process valid records even if some fail

---

### 16. Explicit Error Types

**Location:** `src/types.ts` - `PipelineError`

**Description:** Structured error objects with all necessary context instead of generic exceptions.

**Implementation:**

```typescript
export interface PipelineError {
  stage: string; // Where error occurred
  record: RawVendorRecord; // What failed
  reason: string; // Why it failed
  details?: unknown; // Additional context
}
```

**Benefits:**

- Rich error information
- Easy to debug
- Can be logged/monitored
- Type-safe error handling

---

### 17. Fail-Safe Defaults

**Location:** `src/pipeline.ts` - Error handling in batch stages

**Description:** When batch operations fail, the system falls back to partial results rather than complete failure.

**Implementation:**

```typescript
if (!deduplicateResult.success) {
  errors.push(deduplicateResult.error);
  // Fallback: use what we have
  deduplicatedRecords = validatedRecords;
}
```

**Benefits:**

- Resilient to partial failures
- Maximum data preservation
- Graceful degradation
- Better user experience

---

## Type System Patterns

### 18. Discriminated Unions

**Location:** `src/types.ts` - `PipelineResult<T>`

**Description:** Type-safe union types with a discriminator field that TypeScript uses for narrowing.

**Implementation:**

```typescript
type PipelineResult<T> =
  | { success: true; data: T }
  | { success: false; error: PipelineError };
```

**Benefits:**

- Type-safe error handling
- Exhaustive checking
- No null/undefined issues
- Compiler-enforced error handling

---

### 19. Type Narrowing

**Location:** Throughout codebase

**Description:** Using TypeScript's control flow analysis to narrow types based on runtime checks.

**Implementation:**

```typescript
if (result.success) {
  // TypeScript knows result.data exists here
  process(result.data);
} else {
  // TypeScript knows result.error exists here
  handleError(result.error);
}
```

**Benefits:**

- Type safety
- No type assertions needed
- Compiler catches errors
- Better IDE support

---

### 20. Progressive Type Refinement

**Location:** Type definitions (`RawVendorRecord` → `SanitizedRecord` → `ValidatedRecord` → `CanonicalRecord`)

**Description:** Types become more specific as data flows through the pipeline, representing increasing guarantees about the data.

**Implementation:**

```typescript
RawVendorRecord        // Unknown structure
  → SanitizedRecord    // Known structure, may be invalid
    → ValidatedRecord  // Valid structure
      → CanonicalRecord // Deduplicated and ordered
```

**Benefits:**

- Type safety increases through pipeline
- Compiler enforces correct usage
- Self-documenting code
- Prevents invalid operations

---

### 21. Generic Types

**Location:** `src/types.ts` - `PipelineResult<T>`, `PipelineStage<TInput, TOutput>`

**Description:** Parameterized types that work with any data type while maintaining type safety.

**Implementation:**

```typescript
export type PipelineStage<TInput, TOutput> = (
  input: TInput,
) => PipelineResult<TOutput>;
```

**Benefits:**

- Code reuse
- Type safety
- No type erasure
- Flexible yet safe

---

## Data Processing Patterns

### 22. Iterator/Generator Pattern

**Location:** `src/pipeline.ts` - `processStream()`

**Description:** Uses async generators to process data streams lazily, yielding results as they become available.

**Implementation:**

```typescript
async *processStream(
  records: AsyncIterable<RawVendorRecord>
): AsyncGenerator<{ record?: CanonicalRecord; error?: PipelineError }> {
  for await (const rawRecord of records) {
    // Process and yield
    yield { record: processedRecord };
  }
}
```

**Benefits:**

- Memory efficient (processes one at a time)
- Handles large datasets
- Lazy evaluation
- Composable with other async operations

---

### 23. Batch Processing Pattern

**Location:** `src/pipeline.ts` - `processStream()` with buffer

**Description:** Accumulates records in a buffer and processes them in batches for operations that require the full dataset (like deduplication).

**Implementation:**

```typescript
const validatedBuffer: CanonicalRecord[] = [];
const BATCH_SIZE = 1000;

// Accumulate
validatedBuffer.push(validatedRecord);

// Process when buffer is full
if (validatedBuffer.length >= BATCH_SIZE) {
  const batch = [...validatedBuffer];
  validatedBuffer.length = 0;
  processBatch(batch);
}
```

**Benefits:**

- Efficient for batch operations
- Memory control
- Balances streaming and batch processing
- Configurable batch size

---

### 24. Deterministic Sorting

**Location:** `src/stages/order.ts`, `src/stages/deduplicate.ts`

**Description:** Uses multiple sort keys with consistent ordering to ensure deterministic output regardless of input order.

**Implementation:**

```typescript
ordered.sort((a, b) => {
  // Primary: timestamp
  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp;
  }
  // Secondary: vendorId (breaks ties)
  if (a.vendorId !== b.vendorId) {
    return a.vendorId.localeCompare(b.vendorId);
  }
  // Tertiary: productId (breaks remaining ties)
  return a.productId.localeCompare(b.productId);
});
```

**Benefits:**

- Deterministic output (same input → same output)
- Stable sorting
- Predictable behavior
- Required for reproducibility

---

### 25. Key-Based Deduplication

**Location:** `src/stages/deduplicate.ts`

**Description:** Uses composite keys to identify duplicates and deterministic selection criteria to choose which record to keep.

**Implementation:**

```typescript
const key = `${record.vendorId}:${record.productId}`;
// Keep record with latest timestamp
if (record1.timestamp > record2.timestamp) {
  return record1;
}
```

**Benefits:**

- Efficient duplicate detection
- Deterministic selection
- O(n) complexity with Map
- Clear deduplication rules

---

## Code Organization Patterns

### 26. Module Pattern

**Location:** All source files

**Description:** Each file is a module with a single responsibility, exporting only what's needed.

**Implementation:**

```typescript
// stages/sanitize.ts
export function sanitize(...) { ... }

// index.ts
export * from './stages/sanitize.js';
```

**Benefits:**

- Clear boundaries
- Easy to navigate
- Prevents coupling
- Supports tree-shaking

---

### 27. Separation of Concerns

**Location:** Directory structure

**Description:** Code is organized by concern: types, stages, orchestration, examples, tests.

**Structure:**

```
src/
  types.ts          # Type definitions
  stages/           # Transformation stages
    sanitize.ts
    validate.ts
    deduplicate.ts
    order.ts
  pipeline.ts       # Orchestration
  index.ts          # Public API
  example.ts        # Usage examples
```

**Benefits:**

- Easy to find code
- Clear responsibilities
- Minimal coupling
- Easy to test

---

### 28. Test-Driven Organization

**Location:** Test files mirror source structure

**Description:** Test files are co-located with source files using naming convention.

**Structure:**

```
src/
  stages/
    sanitize.ts
    sanitize.test.ts
    validate.ts
    validate.test.ts
```

**Benefits:**

- Easy to find tests
- Tests stay close to code
- Clear test coverage
- Encourages testing

---

### 29. Configuration Object Pattern

**Location:** `src/pipeline.ts` - `PipelineConfig`

**Description:** Uses a single configuration object instead of multiple parameters, making it easy to add new options.

**Implementation:**

```typescript
interface PipelineConfig {
  continueOnError?: boolean;
  vendorHandlers?: Map<string, VendorHandler>;
}

constructor(config: PipelineConfig = {}) {
  this.config = {
    continueOnError: config.continueOnError ?? true,
    vendorHandlers: config.vendorHandlers ?? new Map()
  };
}
```

**Benefits:**

- Extensible (easy to add options)
- Backward compatible
- Self-documenting
- No parameter order issues

---

### 30. Statistics/Metrics Pattern

**Location:** `src/pipeline.ts` - `PipelineProcessingResult.stats`

**Description:** Tracks metrics throughout processing to provide visibility into pipeline performance and data quality.

**Implementation:**

```typescript
const stats = {
  total: records.length,
  sanitized: 0,
  validated: 0,
  deduplicated: 0,
  ordered: 0,
  failed: 0,
};
// Increment counters at each stage
```

**Benefits:**

- Observability
- Performance monitoring
- Data quality metrics
- Debugging aid

---

## Summary

This project employs **30 distinct patterns** across multiple categories:

- **Architectural:** Pipeline, Layered Architecture
- **Design:** Result/Either, Strategy, Chain of Responsibility, Template Method, Factory, Adapter, Guard, Null Object
- **Functional:** Pure Functions, Immutability, Higher-Order Functions, Function Composition
- **Error Handling:** Error Accumulation, Explicit Error Types, Fail-Safe Defaults
- **Type System:** Discriminated Unions, Type Narrowing, Progressive Type Refinement, Generics
- **Data Processing:** Iterator/Generator, Batch Processing, Deterministic Sorting, Key-Based Deduplication
- **Code Organization:** Module Pattern, Separation of Concerns, Test-Driven Organization, Configuration Object, Statistics

These patterns work together to create a robust, maintainable, testable, and extensible data transformation pipeline that meets all the requirements: determinism, explicit error handling, no silent data loss, independent testability, and extensibility.
