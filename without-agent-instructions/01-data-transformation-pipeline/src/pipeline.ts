/**
 * Main pipeline orchestrator - coordinates all transformation stages
 */

import type {
  RawVendorRecord,
  CanonicalRecord,
  PipelineError,
} from "./types.js";
import { sanitize } from "./stages/sanitize.js";
import { validate } from "./stages/validate.js";
import { deduplicate } from "./stages/deduplicate.js";
import { order } from "./stages/order.js";

/**
 * Pipeline processing result
 */
export interface PipelineProcessingResult {
  /**
   * Successfully processed canonical records
   */
  records: CanonicalRecord[];

  /**
   * Errors encountered during processing (one per failed record)
   */
  errors: PipelineError[];

  /**
   * Statistics about the processing
   */
  stats: {
    total: number;
    sanitized: number;
    validated: number;
    deduplicated: number;
    ordered: number;
    failed: number;
  };
}

/**
 * Configuration for the pipeline
 */
export interface PipelineConfig {
  /**
   * Whether to continue processing after errors (default: true)
   */
  continueOnError?: boolean;

  /**
   * Custom vendor-specific handlers (for extensibility)
   */
  vendorHandlers?: Map<string, VendorHandler>;
}

/**
 * Vendor-specific handler for extensibility
 */
export interface VendorHandler {
  /**
   * Pre-process raw record before sanitization
   */
  preProcess?(record: RawVendorRecord): RawVendorRecord;

  /**
   * Post-process canonical record after ordering
   */
  postProcess?(record: CanonicalRecord): CanonicalRecord;
}

/**
 * Data transformation pipeline
 *
 * Processes raw vendor records through:
 * 1. Sanitization
 * 2. Validation
 * 3. Deduplication
 * 4. Ordering
 *
 * All errors are explicitly tracked - no silent data loss.
 */
export class DataTransformationPipeline {
  private config: Required<PipelineConfig>;

  constructor(config: PipelineConfig = {}) {
    this.config = {
      continueOnError: config.continueOnError ?? true,
      vendorHandlers: config.vendorHandlers ?? new Map(),
    };
  }

  /**
   * Processes a stream of raw vendor records
   *
   * @param records - Array of raw vendor records to process
   * @returns Processing result with canonical records and errors
   */
  process(records: RawVendorRecord[]): PipelineProcessingResult {
    const stats = {
      total: records.length,
      sanitized: 0,
      validated: 0,
      deduplicated: 0,
      ordered: 0,
      failed: 0,
    };

    const errors: PipelineError[] = [];
    const validatedRecords: CanonicalRecord[] = [];

    // Stage 1: Sanitize each record
    for (const rawRecord of records) {
      try {
        // Apply vendor-specific pre-processing if available
        const vendorId = String(
          rawRecord.vendorId ?? rawRecord.vendor_id ?? rawRecord.vendor ?? "",
        );
        const handler = this.config.vendorHandlers.get(vendorId);
        const preProcessedRecord = handler?.preProcess
          ? handler.preProcess(rawRecord)
          : rawRecord;

        const sanitizeResult = sanitize(preProcessedRecord);

        if (!sanitizeResult.success) {
          errors.push(sanitizeResult.error);
          stats.failed++;
          if (!this.config.continueOnError) {
            break;
          }
          continue;
        }

        stats.sanitized++;

        // Stage 2: Validate sanitized record
        const validateResult = validate(sanitizeResult.data);

        if (!validateResult.success) {
          errors.push(validateResult.error);
          stats.failed++;
          if (!this.config.continueOnError) {
            break;
          }
          continue;
        }

        stats.validated++;
        validatedRecords.push(validateResult.data);
      } catch (error) {
        errors.push({
          stage: "pipeline",
          record: rawRecord,
          reason: `Unexpected error during processing: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
        });
        stats.failed++;
        if (!this.config.continueOnError) {
          break;
        }
      }
    }

    // Stage 3: Deduplicate validated records
    let deduplicatedRecords: CanonicalRecord[] = [];
    if (validatedRecords.length > 0) {
      const deduplicateResult = deduplicate(validatedRecords);

      if (!deduplicateResult.success) {
        errors.push(deduplicateResult.error);
        // If deduplication fails, we still try to order what we have
        deduplicatedRecords = validatedRecords;
      } else {
        deduplicatedRecords = deduplicateResult.data;
        stats.deduplicated = deduplicatedRecords.length;
      }
    }

    // Stage 4: Order canonical records
    let orderedRecords: CanonicalRecord[] = [];
    if (deduplicatedRecords.length > 0) {
      const orderResult = order(deduplicatedRecords);

      if (!orderResult.success) {
        errors.push(orderResult.error);
        // If ordering fails, we still return what we have
        orderedRecords = deduplicatedRecords;
      } else {
        orderedRecords = orderResult.data;
        stats.ordered = orderedRecords.length;
      }
    }

    // Apply vendor-specific post-processing if available
    const finalRecords = orderedRecords.map((record) => {
      const handler = this.config.vendorHandlers.get(record.vendorId);
      return handler?.postProcess ? handler.postProcess(record) : record;
    });

    return {
      records: finalRecords,
      errors,
      stats,
    };
  }

  /**
   * Processes records in streaming fashion (for large datasets)
   *
   * @param records - Async iterable of raw vendor records
   * @yields Processing results as they become available
   */
  async *processStream(
    records: AsyncIterable<RawVendorRecord>,
  ): AsyncGenerator<{ record?: CanonicalRecord; error?: PipelineError }> {
    const validatedBuffer: CanonicalRecord[] = [];
    const BATCH_SIZE = 1000; // Process in batches for deduplication

    for await (const rawRecord of records) {
      try {
        // Apply vendor-specific pre-processing if available
        const vendorId = String(
          rawRecord.vendorId ?? rawRecord.vendor_id ?? rawRecord.vendor ?? "",
        );
        const handler = this.config.vendorHandlers.get(vendorId);
        const preProcessedRecord = handler?.preProcess
          ? handler.preProcess(rawRecord)
          : rawRecord;

        const sanitizeResult = sanitize(preProcessedRecord);

        if (!sanitizeResult.success) {
          yield { error: sanitizeResult.error };
          continue;
        }

        const validateResult = validate(sanitizeResult.data);

        if (!validateResult.success) {
          yield { error: validateResult.error };
          continue;
        }

        validatedBuffer.push(validateResult.data);

        // Process batch when buffer is full
        if (validatedBuffer.length >= BATCH_SIZE) {
          const batch = [...validatedBuffer];
          validatedBuffer.length = 0;

          const deduplicateResult = deduplicate(batch);
          if (deduplicateResult.success) {
            const orderResult = order(deduplicateResult.data);
            if (orderResult.success) {
              for (const record of orderResult.data) {
                const handler = this.config.vendorHandlers.get(record.vendorId);
                const finalRecord = handler?.postProcess
                  ? handler.postProcess(record)
                  : record;
                yield { record: finalRecord };
              }
            }
          }
        }
      } catch (error) {
        yield {
          error: {
            stage: "pipeline",
            record: rawRecord,
            reason: `Unexpected error during streaming: ${error instanceof Error ? error.message : String(error)}`,
            details: error,
          },
        };
      }
    }

    // Process remaining records in buffer
    if (validatedBuffer.length > 0) {
      const deduplicateResult = deduplicate(validatedBuffer);
      if (deduplicateResult.success) {
        const orderResult = order(deduplicateResult.data);
        if (orderResult.success) {
          for (const record of orderResult.data) {
            const handler = this.config.vendorHandlers.get(record.vendorId);
            const finalRecord = handler?.postProcess
              ? handler.postProcess(record)
              : record;
            yield { record: finalRecord };
          }
        }
      }
    }
  }
}
