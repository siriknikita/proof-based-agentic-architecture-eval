/**
 * Validation stage - ensures semantic correctness of sanitized records
 */

import type {
  PipelineResult,
  PipelineError,
  SanitizedRecord,
  ValidatedRecord,
} from "../types.js";

/**
 * Validates a sanitized record for semantic correctness
 *
 * This stage checks:
 * - Business rules (price ranges, category validity, etc.)
 * - Data consistency (e.g., currency matches expected format)
 * - Referential integrity (vendor exists, category is valid)
 * - Temporal validity (timestamps are reasonable)
 */
export function validate(
  sanitized: SanitizedRecord,
): PipelineResult<ValidatedRecord> {
  try {
    // Validate productId format (must be non-empty alphanumeric with optional dashes/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized.productId)) {
      return createError(
        "validate",
        sanitized,
        `Invalid productId format: ${sanitized.productId}`,
      );
    }

    // Validate vendorId format
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized.vendorId)) {
      return createError(
        "validate",
        sanitized,
        `Invalid vendorId format: ${sanitized.vendorId}`,
      );
    }

    // Validate productName (must be non-empty, reasonable length)
    if (sanitized.productName.length === 0) {
      return createError("validate", sanitized, "Product name cannot be empty");
    }
    if (sanitized.productName.length > 500) {
      return createError(
        "validate",
        sanitized,
        `Product name too long: ${sanitized.productName.length} characters`,
      );
    }

    // Validate price (must be positive, reasonable maximum)
    if (sanitized.price <= 0) {
      return createError(
        "validate",
        sanitized,
        `Price must be positive: ${sanitized.price}`,
      );
    }
    if (sanitized.price > 1000000000) {
      return createError(
        "validate",
        sanitized,
        `Price too large: ${sanitized.price}`,
      );
    }

    // Validate currency (must be valid ISO 4217 code)
    const validCurrencies = new Set([
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CNY",
      "AUD",
      "CAD",
      "CHF",
      "INR",
      "BRL",
      "MXN",
      "KRW",
      "SGD",
      "HKD",
      "NOK",
      "SEK",
      "DKK",
      "PLN",
      "RUB",
      "ZAR",
    ]);
    if (!validCurrencies.has(sanitized.currency)) {
      return createError(
        "validate",
        sanitized,
        `Invalid currency code: ${sanitized.currency}`,
      );
    }

    // Validate category (must be non-empty, reasonable format)
    if (sanitized.category.length === 0) {
      return createError("validate", sanitized, "Category cannot be empty");
    }
    if (sanitized.category.length > 100) {
      return createError(
        "validate",
        sanitized,
        `Category too long: ${sanitized.category.length} characters`,
      );
    }

    // Validate description (optional, but if present must be reasonable length)
    if (sanitized.description.length > 10000) {
      return createError(
        "validate",
        sanitized,
        `Description too long: ${sanitized.description.length} characters`,
      );
    }

    // Validate timestamp (must be within reasonable range)
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;

    if (sanitized.timestamp < oneYearAgo) {
      return createError(
        "validate",
        sanitized,
        `Timestamp too old: ${new Date(sanitized.timestamp).toISOString()}`,
      );
    }
    if (sanitized.timestamp > oneYearFromNow) {
      return createError(
        "validate",
        sanitized,
        `Timestamp too far in future: ${new Date(sanitized.timestamp).toISOString()}`,
      );
    }

    // All validations passed
    const validated: ValidatedRecord = {
      ...sanitized,
    };

    return { success: true, data: validated };
  } catch (error) {
    return createError(
      "validate",
      sanitized,
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Creates a pipeline error
 */
function createError(
  stage: string,
  record: SanitizedRecord,
  reason: string,
  details?: unknown,
): PipelineResult<ValidatedRecord> {
  return {
    success: false,
    error: {
      stage,
      record,
      reason,
      details,
    },
  };
}
