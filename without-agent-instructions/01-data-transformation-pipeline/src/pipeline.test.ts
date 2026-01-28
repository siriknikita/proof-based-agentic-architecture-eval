/**
 * Unit tests for main pipeline
 */

import { describe, it, expect } from "@jest/globals";
import { DataTransformationPipeline } from "./pipeline.js";
import type { RawVendorRecord } from "./types.js";

describe("DataTransformationPipeline", () => {
  const createValidRawRecord = (
    overrides?: Partial<RawVendorRecord>,
  ): RawVendorRecord => ({
    productId: "prod-123",
    vendorId: "vendor-abc",
    productName: "Test Product",
    price: 99.99,
    currency: "USD",
    category: "electronics",
    description: "A test product",
    timestamp: Date.now(),
    ...overrides,
  });

  it("should process valid records successfully", () => {
    const pipeline = new DataTransformationPipeline();
    const records = [
      createValidRawRecord({ productId: "prod-1" }),
      createValidRawRecord({ productId: "prod-2" }),
    ];

    const result = pipeline.process(records);

    expect(result.records.length).toBe(2);
    expect(result.errors.length).toBe(0);
    expect(result.stats.total).toBe(2);
    expect(result.stats.validated).toBe(2);
    expect(result.stats.ordered).toBe(2);
  });

  it("should handle invalid records and continue processing", () => {
    const pipeline = new DataTransformationPipeline({ continueOnError: true });
    const records = [
      createValidRawRecord({ productId: "prod-1" }),
      createValidRawRecord({ productId: "" }), // Invalid - missing productId
      createValidRawRecord({ productId: "prod-3" }),
    ];

    const result = pipeline.process(records);

    expect(result.records.length).toBe(2);
    expect(result.errors.length).toBe(1);
    expect(result.stats.total).toBe(3);
    expect(result.stats.failed).toBe(1);
  });

  it("should stop processing on error when continueOnError is false", () => {
    const pipeline = new DataTransformationPipeline({ continueOnError: false });
    const records = [
      createValidRawRecord({ productId: "prod-1" }),
      createValidRawRecord({ productId: "" }), // Invalid
      createValidRawRecord({ productId: "prod-3" }),
    ];

    const result = pipeline.process(records);

    expect(result.errors.length).toBe(1);
    // May have processed first record or stopped immediately
  });

  it("should deduplicate records", () => {
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 1000;

    const pipeline = new DataTransformationPipeline();
    const records = [
      createValidRawRecord({
        productId: "prod-1",
        vendorId: "vendor-1",
        timestamp: timestamp1,
      }),
      createValidRawRecord({
        productId: "prod-1",
        vendorId: "vendor-1",
        timestamp: timestamp2,
      }), // Duplicate
      createValidRawRecord({
        productId: "prod-2",
        vendorId: "vendor-1",
        timestamp: timestamp1,
      }),
    ];

    const result = pipeline.process(records);

    expect(result.records.length).toBe(2);
    // Should keep the one with latest timestamp
    const kept = result.records.find((r) => r.productId === "prod-1");
    expect(kept).toBeDefined();
    expect(kept?.timestamp).toBe(timestamp2);
  });

  it("should order records by timestamp", () => {
    const timestamp1 = Date.now();
    const timestamp2 = timestamp1 + 1000;
    const timestamp3 = timestamp1 + 2000;

    const pipeline = new DataTransformationPipeline();
    const records = [
      createValidRawRecord({ productId: "prod-3", timestamp: timestamp3 }),
      createValidRawRecord({ productId: "prod-1", timestamp: timestamp1 }),
      createValidRawRecord({ productId: "prod-2", timestamp: timestamp2 }),
    ];

    const result = pipeline.process(records);

    expect(result.records.length).toBe(3);
    expect(result.records[0].productId).toBe("prod-1");
    expect(result.records[1].productId).toBe("prod-2");
    expect(result.records[2].productId).toBe("prod-3");
  });

  it("should track statistics correctly", () => {
    const pipeline = new DataTransformationPipeline();
    const records = [
      createValidRawRecord({ productId: "prod-1" }),
      createValidRawRecord({ productId: "prod-2" }),
      createValidRawRecord({ price: "invalid" }), // Will fail validation
    ];

    const result = pipeline.process(records);

    expect(result.stats.total).toBe(3);
    expect(result.stats.sanitized).toBeGreaterThanOrEqual(2);
    expect(result.stats.validated).toBe(2);
    expect(result.stats.failed).toBe(1);
  });

  it("should apply vendor-specific handlers", async () => {
    const vendorHandlers = new Map([
      [
        "vendor-1",
        {
          preProcess: (record: RawVendorRecord) => ({
            ...record,
            productName: `PRE: ${record.productName}`,
          }),
          postProcess: (record) => ({
            ...record,
            productName: `${record.productName} :POST`,
          }),
        },
      ],
    ]);

    const pipeline = new DataTransformationPipeline({ vendorHandlers });
    const records = [
      createValidRawRecord({ vendorId: "vendor-1", productName: "Test" }),
    ];

    const result = pipeline.process(records);

    expect(result.records.length).toBe(1);
    expect(result.records[0].productName).toContain("PRE:");
    expect(result.records[0].productName).toContain(":POST");
  });

  it("should handle empty input", () => {
    const pipeline = new DataTransformationPipeline();
    const result = pipeline.process([]);

    expect(result.records.length).toBe(0);
    expect(result.errors.length).toBe(0);
    expect(result.stats.total).toBe(0);
  });
});
