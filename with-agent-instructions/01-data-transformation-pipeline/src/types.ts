/**
 * Type definitions for the data transformation pipeline
 */

// Result type for explicit error handling (no silent failures)
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

// Error types
export type PipelineError =
  | SanitizationError
  | ValidationError
  | DeduplicationError
  | OrderingError;

export type SanitizationError = {
  type: "SANITIZATION_ERROR";
  message: string;
  recordIndex: number;
  field?: string;
};

export type ValidationError = {
  type: "VALIDATION_ERROR";
  message: string;
  recordIndex: number;
  field?: string;
};

export type DeduplicationError = {
  type: "DEDUPLICATION_ERROR";
  message: string;
};

export type OrderingError = {
  type: "ORDERING_ERROR";
  message: string;
};

// Record types through the pipeline
export type RawRecord = Record<string, unknown>;

export type SanitizedRecord = Record<string, unknown>;

export type ValidatedRecord = Record<string, unknown> & {
  _id: string; // Deterministic identity for deduplication
  _timestamp: number; // For ordering
};

export type CanonicalRecord = ValidatedRecord;

// Vendor configuration
export type VendorConfig = {
  vendorId: string;
  sanitizers: FieldSanitizer[];
  validators: FieldValidator[];
  identityFields: string[]; // Fields used to generate record identity
  orderingField: string; // Field used for ordering
};

export type FieldSanitizer = {
  field: string;
  sanitize: (value: unknown) => unknown;
};

export type FieldValidator = {
  field: string;
  validate: (value: unknown) => boolean;
  errorMessage: string;
};
