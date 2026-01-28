/**
 * Ordering step: Arranges records by deterministic criterion
 */

import type {
  ValidatedRecord,
  CanonicalRecord,
  OrderingError,
} from "./types.js";
import type { Result } from "./types.js";
import { ok, err } from "./result.js";

export function orderRecords(
  records: ValidatedRecord[],
): Result<CanonicalRecord[], OrderingError> {
  try {
    // Create a copy to avoid mutating input
    const ordered = [...records];

    // Sort by timestamp (deterministic: stable sort)
    ordered.sort((a, b) => {
      const timeDiff = a._timestamp - b._timestamp;
      if (timeDiff !== 0) {
        return timeDiff;
      }
      // If timestamps are equal, use identity for stable ordering
      return a._id.localeCompare(b._id);
    });

    return ok(ordered);
  } catch (error) {
    return err({
      type: "ORDERING_ERROR",
      message: `Failed to order records: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
