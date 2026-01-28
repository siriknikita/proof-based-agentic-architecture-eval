/**
 * Validation step: Checks semantic correctness
 */

import type {
  SanitizedRecord,
  ValidatedRecord,
  ValidationError,
  VendorConfig,
} from "./types.js";
import type { Result } from "./types.js";
import { ok, err } from "./result.js";

export function validateRecords(
  records: SanitizedRecord[],
  config: VendorConfig,
): Result<ValidatedRecord[], ValidationError> {
  const validated: ValidatedRecord[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Validate all required fields
    for (const validator of config.validators) {
      const fieldValue = record[validator.field];
      if (!validator.validate(fieldValue)) {
        return err({
          type: "VALIDATION_ERROR",
          message: validator.errorMessage,
          recordIndex: i,
          field: validator.field,
        });
      }
    }

    // Generate deterministic identity
    const identityParts = config.identityFields.map((field) => {
      const value = record[field];
      return value !== undefined && value !== null ? String(value) : "";
    });
    const identity = identityParts.join("|");

    // Extract ordering value
    const orderingValue = record[config.orderingField];
    let timestamp: number;

    if (typeof orderingValue === "number") {
      timestamp = orderingValue;
    } else if (typeof orderingValue === "string") {
      const parsed = Number(orderingValue);
      timestamp = isNaN(parsed) ? i : parsed; // Fallback to index if not parseable
    } else {
      timestamp = i; // Fallback to index
    }

    // Create validated record with identity and timestamp
    const validatedRecord: ValidatedRecord = {
      ...record,
      _id: identity,
      _timestamp: timestamp,
    };

    validated.push(validatedRecord);
  }

  return ok(validated);
}
