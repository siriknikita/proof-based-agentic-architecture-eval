/**
 * Sanitization stage - cleans malformed fields from raw vendor records
 */

import type {
  PipelineResult,
  PipelineError,
  RawVendorRecord,
  SanitizedRecord,
} from "../types.js";

/**
 * Sanitizes a raw vendor record by cleaning malformed fields
 *
 * This stage handles:
 * - Type coercion (strings to numbers, etc.)
 * - Trimming whitespace
 * - Removing null/undefined values
 * - Normalizing field names
 * - Providing defaults for missing required fields
 */
export function sanitize(
  rawRecord: RawVendorRecord,
): PipelineResult<SanitizedRecord> {
  try {
    // Extract and sanitize productId
    const productId = sanitizeString(
      rawRecord.productId ?? rawRecord.product_id ?? rawRecord.id,
    );
    if (!productId) {
      return createError(
        "sanitize",
        rawRecord,
        "Missing required field: productId",
      );
    }

    // Extract and sanitize vendorId
    const vendorId = sanitizeString(
      rawRecord.vendorId ?? rawRecord.vendor_id ?? rawRecord.vendor,
    );
    if (!vendorId) {
      return createError(
        "sanitize",
        rawRecord,
        "Missing required field: vendorId",
      );
    }

    // Extract and sanitize productName
    const productName = sanitizeString(
      rawRecord.productName ?? rawRecord.product_name ?? rawRecord.name,
    );
    if (!productName) {
      return createError(
        "sanitize",
        rawRecord,
        "Missing required field: productName",
      );
    }

    // Extract and sanitize price
    const price = sanitizeNumber(rawRecord.price);
    if (price === null || price < 0) {
      return createError(
        "sanitize",
        rawRecord,
        `Invalid price: ${rawRecord.price}`,
      );
    }

    // Extract and sanitize currency
    const currency = sanitizeCurrency(
      rawRecord.currency ?? rawRecord.curr ?? "USD",
    );
    if (!currency) {
      return createError(
        "sanitize",
        rawRecord,
        `Invalid currency: ${rawRecord.currency}`,
      );
    }

    // Extract and sanitize category
    const category = sanitizeString(
      rawRecord.category ?? rawRecord.cat ?? "uncategorized",
    );
    if (!category) {
      return createError("sanitize", rawRecord, "Invalid category");
    }

    // Extract and sanitize description
    const description = sanitizeString(
      rawRecord.description ?? rawRecord.desc ?? "",
    );

    // Extract and sanitize timestamp
    const timestamp = sanitizeTimestamp(
      rawRecord.timestamp ??
        rawRecord.time ??
        rawRecord.createdAt ??
        Date.now(),
    );
    if (timestamp === null) {
      return createError(
        "sanitize",
        rawRecord,
        `Invalid timestamp: ${rawRecord.timestamp}`,
      );
    }

    // Extract metadata (all other fields)
    const metadata: Record<string, unknown> = {};
    const knownFields = new Set([
      "productId",
      "product_id",
      "id",
      "vendorId",
      "vendor_id",
      "vendor",
      "productName",
      "product_name",
      "name",
      "price",
      "currency",
      "curr",
      "category",
      "cat",
      "description",
      "desc",
      "timestamp",
      "time",
      "createdAt",
    ]);

    for (const [key, value] of Object.entries(rawRecord)) {
      if (!knownFields.has(key) && value !== null && value !== undefined) {
        metadata[key] = value;
      }
    }

    const sanitized: SanitizedRecord = {
      productId,
      vendorId,
      productName,
      price,
      currency,
      category,
      description,
      timestamp,
      metadata,
    };

    return { success: true, data: sanitized };
  } catch (error) {
    return createError(
      "sanitize",
      rawRecord,
      `Sanitization failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Sanitizes a string value
 */
function sanitizeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

/**
 * Sanitizes a number value
 */
function sanitizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Sanitizes a currency code
 */
function sanitizeCurrency(value: unknown): string {
  const str = sanitizeString(value).toUpperCase();
  // Basic validation - must be 3 uppercase letters
  if (/^[A-Z]{3}$/.test(str)) {
    return str;
  }
  return "";
}

/**
 * Sanitizes a timestamp value
 */
function sanitizeTimestamp(value: unknown): number | null {
  if (typeof value === "number") {
    // Check if it's a reasonable timestamp (between 2000 and 2100)
    if (value > 946684800000 && value < 4102444800000) {
      return Math.floor(value);
    }
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    // Try parsing as ISO string or number
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const timestamp = date.getTime();
      if (timestamp > 946684800000 && timestamp < 4102444800000) {
        return Math.floor(timestamp);
      }
    }
    // Try parsing as number string
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 946684800000 && num < 4102444800000) {
      return Math.floor(num);
    }
    return null;
  }
  return null;
}

/**
 * Creates a pipeline error
 */
function createError(
  stage: string,
  record: RawVendorRecord,
  reason: string,
  details?: unknown,
): PipelineResult<SanitizedRecord> {
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
