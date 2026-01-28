/**
 * Sanitization step: Corrects malformed fields
 */

import type {
  RawRecord,
  SanitizedRecord,
  SanitizationError,
  VendorConfig,
} from "./types.js";
import type { Result } from "./types.js";
import { ok, err } from "./result.js";

export function sanitizeRecords(
  records: RawRecord[],
  config: VendorConfig,
): Result<SanitizedRecord[], SanitizationError> {
  const sanitized: SanitizedRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const sanitizedRecord: SanitizedRecord = {};

    // Apply all sanitizers to each field
    for (const sanitizer of config.sanitizers) {
      const fieldValue = record[sanitizer.field];
      try {
        sanitizedRecord[sanitizer.field] = sanitizer.sanitize(fieldValue);
      } catch (error) {
        return err({
          type: "SANITIZATION_ERROR",
          message: `Failed to sanitize field "${sanitizer.field}": ${error instanceof Error ? error.message : String(error)}`,
          recordIndex: i,
          field: sanitizer.field,
        });
      }
    }

    // Copy non-sanitized fields as-is
    for (const key in record) {
      if (!(key in sanitizedRecord)) {
        sanitizedRecord[key] = record[key];
      }
    }

    sanitized.push(sanitizedRecord);
  }

  return ok(sanitized);
}
