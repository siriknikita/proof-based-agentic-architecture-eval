/**
 * Ordering stage - produces a canonical, ordered output stream
 */

import type {
  PipelineResult,
  PipelineError,
  CanonicalRecord,
  BatchPipelineStage,
  RawVendorRecord,
} from "../types.js";

/**
 * Orders a batch of canonical records into a deterministic sequence
 *
 * Ordering strategy (applied in priority order):
 * 1. Primary: timestamp (ascending - oldest first)
 * 2. Secondary: vendorId (ascending)
 * 3. Tertiary: productId (ascending)
 *
 * This ensures:
 * - Deterministic output (same input always produces same order)
 * - Temporal ordering (records appear in chronological order)
 * - Stable sorting (ties are broken consistently)
 */
export const order: BatchPipelineStage<CanonicalRecord, CanonicalRecord[]> = (
  records: CanonicalRecord[],
): PipelineResult<CanonicalRecord[]> => {
  try {
    // Create a copy to avoid mutating the input
    const ordered = [...records];

    // Sort deterministically
    ordered.sort((a, b) => {
      // Primary: timestamp (ascending)
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }

      // Secondary: vendorId (ascending)
      if (a.vendorId !== b.vendorId) {
        return a.vendorId.localeCompare(b.vendorId);
      }

      // Tertiary: productId (ascending)
      return a.productId.localeCompare(b.productId);
    });

    return { success: true, data: ordered };
  } catch (error) {
    return {
      success: false,
      error: {
        stage: "order",
        record: {} as RawVendorRecord,
        reason: `Ordering failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      },
    };
  }
};
