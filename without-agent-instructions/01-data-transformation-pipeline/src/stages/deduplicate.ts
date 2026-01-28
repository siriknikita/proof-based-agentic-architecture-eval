/**
 * Deduplication stage - removes duplicate records deterministically
 */

import type {
  PipelineResult,
  PipelineError,
  ValidatedRecord,
  CanonicalRecord,
  BatchPipelineStage,
  RawVendorRecord,
} from "../types.js";

/**
 * Deduplicates a batch of validated records deterministically
 *
 * Strategy:
 * - Records are considered duplicates if they have the same (productId, vendorId) pair
 * - When duplicates are found, we keep the one with the latest timestamp
 * - If timestamps are equal, we use a deterministic tie-breaker (lexicographic comparison of all fields)
 * - This ensures the same input always produces the same output
 */
export const deduplicate: BatchPipelineStage<
  ValidatedRecord,
  CanonicalRecord[]
> = (records: ValidatedRecord[]): PipelineResult<CanonicalRecord[]> => {
  try {
    // Create a map to track the best record for each (productId, vendorId) pair
    const recordMap = new Map<string, ValidatedRecord>();

    for (const record of records) {
      const key = createDeduplicationKey(record);
      const existing = recordMap.get(key);

      if (!existing) {
        // First occurrence of this key
        recordMap.set(key, record);
      } else {
        // Duplicate found - determine which one to keep
        const kept = selectBestRecord(existing, record);
        recordMap.set(key, kept);
      }
    }

    // Convert map values to array of canonical records
    const canonicalRecords: CanonicalRecord[] = Array.from(
      recordMap.values(),
    ).map((record) => ({
      ...record,
    }));

    return { success: true, data: canonicalRecords };
  } catch (error) {
    return {
      success: false,
      error: {
        stage: "deduplicate",
        record: {} as RawVendorRecord,
        reason: `Deduplication failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      },
    };
  }
};

/**
 * Creates a deterministic deduplication key from a record
 */
function createDeduplicationKey(record: ValidatedRecord): string {
  // Use productId and vendorId as the key
  // This ensures records with the same product from the same vendor are considered duplicates
  return `${record.vendorId}:${record.productId}`;
}

/**
 * Selects the best record between two duplicates deterministically
 *
 * Priority:
 * 1. Latest timestamp
 * 2. If timestamps are equal, use lexicographic comparison of all fields
 */
function selectBestRecord(
  record1: ValidatedRecord,
  record2: ValidatedRecord,
): ValidatedRecord {
  // First, compare by timestamp (higher is better)
  if (record1.timestamp > record2.timestamp) {
    return record1;
  }
  if (record2.timestamp > record1.timestamp) {
    return record2;
  }

  // Timestamps are equal - use deterministic tie-breaker
  // Compare all fields lexicographically to ensure determinism
  const fields1 = serializeRecord(record1);
  const fields2 = serializeRecord(record2);

  // Return the one that comes first lexicographically (ensures determinism)
  // In practice, we want the "better" record, so we'll use a consistent ordering
  return fields1 < fields2 ? record1 : record2;
}

/**
 * Serializes a record to a string for deterministic comparison
 *
 * This creates a canonical string representation that can be compared lexicographically
 */
function serializeRecord(record: ValidatedRecord): string {
  // Create a deterministic string representation
  // Order fields consistently
  const parts = [
    record.productId,
    record.vendorId,
    record.productName,
    record.price.toString(),
    record.currency,
    record.category,
    record.description,
    record.timestamp.toString(),
    JSON.stringify(record.metadata, Object.keys(record.metadata).sort()),
  ];
  return parts.join("|");
}
