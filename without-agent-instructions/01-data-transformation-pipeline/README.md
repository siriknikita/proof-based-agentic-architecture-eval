# Data Transformation Pipeline

A robust, deterministic data transformation pipeline for processing raw vendor product records with explicit error handling and no silent data loss.

## Overview

This pipeline processes streams of raw vendor records that may be:

- Malformed or partially valid
- Duplicated
- Out of order

The pipeline transforms them into a canonical, ordered output stream through four stages:

1. **Sanitization** - Cleans malformed fields
2. **Validation** - Ensures semantic correctness
3. **Deduplication** - Removes duplicates deterministically
4. **Ordering** - Produces canonical output order

> 📚 **Design Patterns**: This project uses 30+ design patterns. See [PATTERNS.md](./PATTERNS.md) for a comprehensive catalog of all patterns used, including architectural patterns, design patterns, functional programming patterns, error handling patterns, and more.

## Design Principles

### Deterministic Processing

- Same input always produces the same output
- Deduplication uses consistent rules (latest timestamp wins)
- Ordering is stable and predictable

### Explicit Error Handling

- All failures are tracked with detailed error information
- No silent data loss - every record is either processed or explicitly marked as failed
- Errors include stage, record, reason, and optional details

### Modular Architecture

- Each transformation stage is independently testable
- Stages can be used in isolation or as part of the full pipeline
- Clear separation of concerns

### Extensibility

- Vendor-specific handlers can be added without modifying core logic
- New validation rules can be added easily
- Pipeline configuration is flexible

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```typescript
import { DataTransformationPipeline } from "./src/index.js";

const pipeline = new DataTransformationPipeline();

const rawRecords = [
  {
    productId: "prod-123",
    vendorId: "vendor-abc",
    productName: "Test Product",
    price: 99.99,
    currency: "USD",
    category: "electronics",
    timestamp: Date.now(),
  },
  // ... more records
];

const result = pipeline.process(rawRecords);

console.log(`Processed ${result.records.length} records`);
console.log(`Encountered ${result.errors.length} errors`);

// Access canonical records
for (const record of result.records) {
  console.log(record);
}

// Access errors
for (const error of result.errors) {
  console.error(`Error in ${error.stage}: ${error.reason}`);
  console.error("Failed record:", error.record);
}
```

### Streaming Processing

For large datasets, use the streaming API:

```typescript
async function processStream() {
  const pipeline = new DataTransformationPipeline();

  // Simulate async iterable
  async function* generateRecords() {
    // ... yield raw records
  }

  for await (const item of pipeline.processStream(generateRecords())) {
    if (item.record) {
      // Process successful record
      console.log("Processed:", item.record);
    } else if (item.error) {
      // Handle error
      console.error("Error:", item.error);
    }
  }
}
```

### Vendor-Specific Handlers

Extend the pipeline for vendor-specific requirements:

```typescript
import { DataTransformationPipeline } from "./src/index.js";
import type { RawVendorRecord, CanonicalRecord } from "./src/index.js";

const vendorHandlers = new Map([
  [
    "special-vendor",
    {
      // Pre-process raw record before sanitization
      preProcess: (record: RawVendorRecord) => {
        // Normalize vendor-specific field names
        return {
          ...record,
          productName: record.customName || record.productName,
        };
      },
      // Post-process canonical record after ordering
      postProcess: (record: CanonicalRecord) => {
        // Add vendor-specific metadata
        return {
          ...record,
          metadata: {
            ...record.metadata,
            vendorSpecific: true,
          },
        };
      },
    },
  ],
]);

const pipeline = new DataTransformationPipeline({ vendorHandlers });
```

### Error Handling Configuration

Control how the pipeline handles errors:

```typescript
// Continue processing after errors (default)
const pipeline = new DataTransformationPipeline({
  continueOnError: true,
});

// Stop processing on first error
const pipeline = new DataTransformationPipeline({
  continueOnError: false,
});
```

## Pipeline Stages

### 1. Sanitization (`sanitize`)

Cleans malformed fields from raw records:

- Type coercion (strings to numbers, etc.)
- Trimming whitespace
- Normalizing field names (handles `productId`, `product_id`, `id`)
- Providing defaults for missing optional fields
- Extracting metadata from unknown fields

**Input:** `RawVendorRecord`  
**Output:** `SanitizedRecord` or `PipelineError`

### 2. Validation (`validate`)

Ensures semantic correctness:

- Field format validation (productId, vendorId patterns)
- Business rules (price ranges, currency codes)
- Data consistency checks
- Temporal validity (timestamp ranges)

**Input:** `SanitizedRecord`  
**Output:** `ValidatedRecord` or `PipelineError`

### 3. Deduplication (`deduplicate`)

Removes duplicate records deterministically:

- Records are considered duplicates if they share the same `(productId, vendorId)` pair
- When duplicates exist, keeps the record with the latest timestamp
- If timestamps are equal, uses deterministic tie-breaker (lexicographic comparison)
- Ensures same input always produces same output

**Input:** `ValidatedRecord[]`  
**Output:** `CanonicalRecord[]` or `PipelineError`

### 4. Ordering (`order`)

Produces canonical output order:

- Primary: timestamp (ascending - oldest first)
- Secondary: vendorId (ascending)
- Tertiary: productId (ascending)
- Ensures deterministic, stable sorting

**Input:** `CanonicalRecord[]`  
**Output:** `CanonicalRecord[]` or `PipelineError`

## Type Definitions

### RawVendorRecord

```typescript
type RawVendorRecord = Record<string, unknown>;
```

May contain any fields, with various naming conventions.

### SanitizedRecord

```typescript
interface SanitizedRecord {
  productId: string;
  vendorId: string;
  productName: string;
  price: number;
  currency: string;
  category: string;
  description: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}
```

### ValidatedRecord

```typescript
interface ValidatedRecord extends SanitizedRecord {
  // Semantically correct record
}
```

### CanonicalRecord

```typescript
interface CanonicalRecord extends ValidatedRecord {
  // Deduplicated and ready for output
}
```

### PipelineError

```typescript
interface PipelineError {
  stage: string; // Stage where error occurred
  record: RawVendorRecord; // Original record that failed
  reason: string; // Human-readable error message
  details?: unknown; // Optional error details
}
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Each stage has comprehensive unit tests covering:

- Happy paths
- Error cases
- Edge cases
- Deterministic behavior

## Design Decisions

### Why Deterministic Deduplication?

Deterministic deduplication ensures that:

- Same input always produces same output (important for reproducibility)
- Testing is reliable
- Debugging is easier (same issue always manifests the same way)

The strategy of keeping the latest timestamp ensures we always have the most recent data, while the lexicographic tie-breaker ensures determinism even when timestamps are equal.

### Why Explicit Error Handling?

Explicit error handling ensures:

- No silent data loss - every record is accounted for
- Debugging is easier - we know exactly what failed and why
- Monitoring is possible - we can track error rates by stage
- Recovery is possible - we can retry failed records

### Why Modular Stages?

Modular stages enable:

- Independent testing of each transformation
- Reusability - stages can be used in different contexts
- Maintainability - changes to one stage don't affect others
- Extensibility - new stages can be added easily

### Why Vendor Handlers?

Vendor handlers enable:

- Extensibility without modifying core logic
- Vendor-specific field mappings
- Custom validation rules per vendor
- Post-processing for vendor-specific formats

### Field Name Normalization

The sanitization stage handles multiple field name conventions:

- `productId`, `product_id`, `id` → `productId`
- `vendorId`, `vendor_id`, `vendor` → `vendorId`
- `productName`, `product_name`, `name` → `productName`

This makes the pipeline tolerant of different vendor data formats without requiring pre-processing.

### Timestamp Validation

Timestamps are validated to be within a reasonable range (one year ago to one year in the future) to catch:

- Clock skew issues
- Invalid data
- Test data with unrealistic timestamps

## Performance Considerations

- The pipeline processes records in batches for deduplication
- Streaming API is available for large datasets
- Each stage is optimized for common cases
- No premature optimization - code is clear and maintainable first

## Extending the Pipeline

### Adding a New Validation Rule

Edit `src/stages/validate.ts`:

```typescript
// Add new validation check
if (/* new condition */) {
  return createError('validate', sanitized, 'New validation message');
}
```

### Adding a New Vendor Handler

```typescript
const vendorHandlers = new Map([
  [
    "new-vendor",
    {
      preProcess: (record) => {
        /* ... */
      },
      postProcess: (record) => {
        /* ... */
      },
    },
  ],
]);
```

### Adding a New Stage

1. Create new stage file in `src/stages/`
2. Implement stage function with `PipelineResult` return type
3. Add stage to pipeline orchestrator in `src/pipeline.ts`
4. Add tests in `src/stages/[stage-name].test.ts`

## License

MIT
