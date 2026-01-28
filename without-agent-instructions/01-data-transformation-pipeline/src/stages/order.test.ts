/**
 * Unit tests for ordering stage
 */

import { describe, it, expect } from "@jest/globals";
import { order } from "./order.js";
import type { CanonicalRecord } from "../types.js";

describe("order", () => {
  const createRecord = (
    timestamp: number,
    vendorId: string,
    productId: string,
  ): CanonicalRecord => ({
    productId,
    vendorId,
    productName: "Product",
    price: 100,
    currency: "USD",
    category: "test",
    description: "",
    timestamp,
    metadata: {},
  });

  it("should order records by timestamp ascending", () => {
    const records = [
      createRecord(3000, "vendor-1", "prod-1"),
      createRecord(1000, "vendor-1", "prod-2"),
      createRecord(2000, "vendor-1", "prod-3"),
    ];

    const result = order(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].timestamp).toBe(1000);
      expect(result.data[1].timestamp).toBe(2000);
      expect(result.data[2].timestamp).toBe(3000);
    }
  });

  it("should break timestamp ties with vendorId", () => {
    const records = [
      createRecord(1000, "vendor-b", "prod-1"),
      createRecord(1000, "vendor-a", "prod-2"),
      createRecord(1000, "vendor-c", "prod-3"),
    ];

    const result = order(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].vendorId).toBe("vendor-a");
      expect(result.data[1].vendorId).toBe("vendor-b");
      expect(result.data[2].vendorId).toBe("vendor-c");
    }
  });

  it("should break vendorId ties with productId", () => {
    const records = [
      createRecord(1000, "vendor-1", "prod-c"),
      createRecord(1000, "vendor-1", "prod-a"),
      createRecord(1000, "vendor-1", "prod-b"),
    ];

    const result = order(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].productId).toBe("prod-a");
      expect(result.data[1].productId).toBe("prod-b");
      expect(result.data[2].productId).toBe("prod-c");
    }
  });

  it("should be deterministic - same input produces same output", () => {
    const records = [
      createRecord(2000, "vendor-2", "prod-2"),
      createRecord(1000, "vendor-1", "prod-1"),
      createRecord(3000, "vendor-3", "prod-3"),
    ];

    const result1 = order(records);
    const result2 = order(records);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success && result2.success) {
      expect(result1.data).toEqual(result2.data);
    }
  });

  it("should handle empty array", () => {
    const result = order([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it("should handle single record", () => {
    const records = [createRecord(1000, "vendor-1", "prod-1")];
    const result = order(records);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(1);
      expect(result.data[0].productId).toBe("prod-1");
    }
  });

  it("should not mutate input array", () => {
    const records = [
      createRecord(3000, "vendor-1", "prod-1"),
      createRecord(1000, "vendor-1", "prod-2"),
    ];
    const original = [...records];

    order(records);

    expect(records).toEqual(original);
  });
});
