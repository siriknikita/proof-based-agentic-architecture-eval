/**
 * Unit tests for validation stage
 */

import { describe, it, expect } from "@jest/globals";
import { validate } from "./validate.js";
import type { SanitizedRecord } from "../types.js";

describe("validate", () => {
  const createValidRecord = (
    overrides?: Partial<SanitizedRecord>,
  ): SanitizedRecord => ({
    productId: "prod-123",
    vendorId: "vendor-abc",
    productName: "Test Product",
    price: 99.99,
    currency: "USD",
    category: "electronics",
    description: "A test product",
    timestamp: Date.now(),
    metadata: {},
    ...overrides,
  });

  it("should validate a correct record", () => {
    const record = createValidRecord();
    const result = validate(record);
    expect(result.success).toBe(true);
  });

  it("should reject invalid productId format", () => {
    const record = createValidRecord({ productId: "prod with spaces!" });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("productId");
    }
  });

  it("should reject invalid vendorId format", () => {
    const record = createValidRecord({ vendorId: "vendor@invalid" });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("vendorId");
    }
  });

  it("should reject empty productName", () => {
    const record = createValidRecord({ productName: "" });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("name");
    }
  });

  it("should reject productName that is too long", () => {
    const record = createValidRecord({ productName: "a".repeat(501) });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("too long");
    }
  });

  it("should reject non-positive price", () => {
    const record = createValidRecord({ price: 0 });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("positive");
    }
  });

  it("should reject negative price", () => {
    const record = createValidRecord({ price: -10 });
    const result = validate(record);
    expect(result.success).toBe(false);
  });

  it("should reject price that is too large", () => {
    const record = createValidRecord({ price: 2000000000 });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("too large");
    }
  });

  it("should reject invalid currency code", () => {
    const record = createValidRecord({ currency: "XXX" });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("currency");
    }
  });

  it("should accept valid currency codes", () => {
    const currencies = ["USD", "EUR", "GBP", "JPY", "CNY"];
    for (const currency of currencies) {
      const record = createValidRecord({ currency });
      const result = validate(record);
      expect(result.success).toBe(true);
    }
  });

  it("should reject empty category", () => {
    const record = createValidRecord({ category: "" });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("category");
    }
  });

  it("should reject category that is too long", () => {
    const record = createValidRecord({ category: "a".repeat(101) });
    const result = validate(record);
    expect(result.success).toBe(false);
  });

  it("should reject description that is too long", () => {
    const record = createValidRecord({ description: "a".repeat(10001) });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("Description");
    }
  });

  it("should reject timestamp that is too old", () => {
    const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
    const record = createValidRecord({ timestamp: twoYearsAgo });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("too old");
    }
  });

  it("should reject timestamp that is too far in future", () => {
    const twoYearsFromNow = Date.now() + 2 * 365 * 24 * 60 * 60 * 1000;
    const record = createValidRecord({ timestamp: twoYearsFromNow });
    const result = validate(record);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("validate");
      expect(result.error.reason).toContain("future");
    }
  });
});
