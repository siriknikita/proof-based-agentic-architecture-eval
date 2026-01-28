/**
 * Type definitions for the data transformation pipeline
 */

/**
 * Raw vendor record - may be malformed, partial, or invalid
 */
export type RawVendorRecord = Record<string, unknown>;

/**
 * Sanitized record - fields are cleaned but may still be semantically invalid
 */
export interface SanitizedRecord {
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

/**
 * Validated record - semantically correct and ready for processing
 */
export interface ValidatedRecord extends SanitizedRecord {
  // Additional validation metadata can be added here
}

/**
 * Canonical record - deduplicated and ordered, ready for output
 */
export interface CanonicalRecord extends ValidatedRecord {
  // Canonical representation may include additional fields
}

/**
 * Pipeline result - contains either a successful record or an error
 */
export type PipelineResult<T> =
  | { success: true; data: T }
  | { success: false; error: PipelineError };

/**
 * Pipeline error with explicit failure information
 */
export interface PipelineError {
  stage: string;
  record: RawVendorRecord;
  reason: string;
  details?: unknown;
}

/**
 * Stage function type - transforms input to output with explicit error handling
 */
export type PipelineStage<TInput, TOutput> = (
  input: TInput,
) => PipelineResult<TOutput>;

/**
 * Batch stage function - processes multiple records
 */
export type BatchPipelineStage<TInput, TOutput> = (
  inputs: TInput[],
) => PipelineResult<TOutput[]>;
