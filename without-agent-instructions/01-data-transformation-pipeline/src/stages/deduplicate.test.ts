/**
 * Unit tests for deduplication stage
 */

import { describe, it, expect } from "@jest/globals";
import { deduplicate } from "./deduplicate.js";
import type { ValidatedRecord } from "../types.js";

describe("deduplicate", () => {
  const createValidRecord = (
    productId: string,
    vendorId: string,
    timestamp: number,
    overrides?: Partial<ValidatedRecord>,
  ): ValidatedRecord => ({
    productId,
    vendorId,
    productName: "Product",
    price: 100,
    currency: "USD",
    category: "test",
    description: "",
    timestamp,
    metadata: {},
    ...overrides,
  });

  it("should return records unchanged when there are no duplicates", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000),
      createValidRecord("prod-2", "vendor-1", 2000),
      createValidRecord("prod-1", "vendor-2", 3000),
    ];

    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(3);
    }
  });

  it("should deduplicate records with same productId and vendorId", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000),
      createValidRecord("prod-1", "vendor-1", 2000), // Duplicate, newer
      createValidRecord("prod-2", "vendor-1", 3000),
    ];

    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      // Should keep the one with latest timestamp
      const kept = result.data.find(
        (r) => r.productId === "prod-1" && r.vendorId === "vendor-1",
      );
      expect(kept).toBeDefined();
      expect(kept?.timestamp).toBe(2000);
    }
  });

  it("should keep the record with latest timestamp when duplicates exist", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000),
      createValidRecord("prod-1", "vendor-1", 3000), // Latest
      createValidRecord("prod-1", "vendor-1", 2000),
    ];

    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].timestamp).toBe(3000);
    }
  });

  it("should be deterministic - same input produces same output", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000, { productName: "A" }),
      createValidRecord("prod-1", "vendor-1", 1000, { productName: "B" }), // Same timestamp
    ];

    const result1 = deduplicate(records);
    const result2 = deduplicate(records);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data.length).toBe(1);
      expect(result2.data.length).toBe(1);
      // Should consistently pick the same one
      expect(result1.data[0].productName).toBe(result2.data[0].productName);
    }
  });

  it("should handle empty array", () => {
    const result = deduplicate([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("should handle single record", () => {
    const records = [createValidRecord("prod-1", "vendor-1", 1000)];
    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].productId).toBe("prod-1");
    }
  });

  it("should not deduplicate records with different vendors", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000),
      createValidRecord("prod-1", "vendor-2", 2000), // Different vendor
    ];

    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
    }
  });

  it("should not deduplicate records with different products", () => {
    const records = [
      createValidRecord("prod-1", "vendor-1", 1000),
      createValidRecord("prod-2", "vendor-1", 2000), // Different product
    ];

    const result = deduplicate(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
    }
  });
});
