/**
 * Main pipeline: Orchestrates all transformation steps
 */

import type {
  RawRecord,
  CanonicalRecord,
  PipelineError,
  VendorConfig,
} from "./types.js";
import type { Result } from "./types.js";
import { sanitizeRecords } from "./sanitize.js";
import { validateRecords } from "./validate.js";
import { deduplicateRecords } from "./deduplicate.js";
import { orderRecords } from "./order.js";
import { err } from "./result.js";

export function processRecords(
  rawRecords: RawRecord[],
  vendorConfig: VendorConfig,
): Result<CanonicalRecord[], PipelineError> {
  // Step 1: Sanitize
  const sanitizedResult = sanitizeRecords(rawRecords, vendorConfig);
  if (!sanitizedResult.success) {
    return err(sanitizedResult.error);
  }

  // Step 2: Validate
  const validatedResult = validateRecords(sanitizedResult.value, vendorConfig);
  if (!validatedResult.success) {
    return err(validatedResult.error);
  }

  // Step 3: Deduplicate
  const deduplicatedResult = deduplicateRecords(validatedResult.value);
  if (!deduplicatedResult.success) {
    return err(deduplicatedResult.error);
  }

  // Step 4: Order
  const orderedResult = orderRecords(deduplicatedResult.value);
  if (!orderedResult.success) {
    return err(orderedResult.error);
  }

  return orderedResult;
}
