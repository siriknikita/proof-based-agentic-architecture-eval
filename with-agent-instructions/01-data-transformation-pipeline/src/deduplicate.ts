/**
 * Deduplication step: Removes duplicate records deterministically
 */

import type { ValidatedRecord, DeduplicationError } from "./types.js";
import type { Result } from "./types.js";
import { ok, err } from "./result.js";

export function deduplicateRecords(
  records: ValidatedRecord[],
): Result<ValidatedRecord[], DeduplicationError> {
  try {
    // Use Map for deterministic deduplication (first occurrence wins)
    const seen = new Map<string, ValidatedRecord>();

    for (const record of records) {
      const id = record._id;

      // Only keep first occurrence (deterministic)
      if (!seen.has(id)) {
        seen.set(id, record);
      }
    }

    // Convert back to array maintaining insertion order
    const deduplicated = Array.from(seen.values());

    return ok(deduplicated);
  } catch (error) {
    return err({
      type: "DEDUPLICATION_ERROR",
      message: `Failed to deduplicate records: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
