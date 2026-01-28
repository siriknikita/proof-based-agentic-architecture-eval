/**
 * Unit tests for sanitization stage
 */

import { describe, it, expect } from "@jest/globals";
import { sanitize } from "./sanitize.js";

describe("sanitize", () => {
  it("should sanitize a well-formed record", () => {
    const raw = {
      productId: "prod-123",
      vendorId: "vendor-abc",
      productName: "Test Product",
      price: 99.99,
      currency: "USD",
      category: "electronics",
      description: "A test product",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("prod-123");
      expect(result.data.vendorId).toBe("vendor-abc");
      expect(result.data.price).toBe(99.99);
    }
  });

  it("should handle alternative field names", () => {
    const raw = {
      product_id: "prod-456",
      vendor_id: "vendor-xyz",
      product_name: "Another Product",
      price: "149.50",
      currency: "EUR",
      category: "books",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("prod-456");
      expect(result.data.vendorId).toBe("vendor-xyz");
      expect(result.data.price).toBe(149.5);
      expect(result.data.currency).toBe("EUR");
    }
  });

  it("should trim whitespace from string fields", () => {
    const raw = {
      productId: "  prod-789  ",
      vendorId: "  vendor-def  ",
      productName: "  Trimmed Product  ",
      price: 200,
      currency: "GBP",
      category: "clothing",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("prod-789");
      expect(result.data.vendorId).toBe("vendor-def");
      expect(result.data.productName).toBe("Trimmed Product");
    }
  });

  it("should convert string prices to numbers", () => {
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: "299.99",
      currency: "USD",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(299.99);
      expect(typeof result.data.price).toBe("number");
    }
  });

  it("should handle ISO timestamp strings", () => {
    const timestamp = Date.now();
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: 100,
      currency: "USD",
      category: "test",
      timestamp: new Date(timestamp).toISOString(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timestamp).toBeGreaterThan(timestamp - 1000);
      expect(result.data.timestamp).toBeLessThan(timestamp + 1000);
    }
  });

  it("should preserve metadata fields", () => {
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: 100,
      currency: "USD",
      category: "test",
      timestamp: Date.now(),
      customField: "customValue",
      anotherField: 123,
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.customField).toBe("customValue");
      expect(result.data.metadata.anotherField).toBe(123);
    }
  });

  it("should fail on missing productId", () => {
    const raw = {
      vendorId: "vendor-1",
      productName: "Product",
      price: 100,
      currency: "USD",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("sanitize");
      expect(result.error.reason).toContain("productId");
    }
  });

  it("should fail on missing vendorId", () => {
    const raw = {
      productId: "prod-1",
      productName: "Product",
      price: 100,
      currency: "USD",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("sanitize");
      expect(result.error.reason).toContain("vendorId");
    }
  });

  it("should fail on invalid price", () => {
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: "not-a-number",
      currency: "USD",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("sanitize");
      expect(result.error.reason).toContain("price");
    }
  });

  it("should fail on invalid currency", () => {
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: 100,
      currency: "INVALID",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.stage).toBe("sanitize");
      expect(result.error.reason).toContain("currency");
    }
  });

  it("should normalize currency to uppercase", () => {
    const raw = {
      productId: "prod-1",
      vendorId: "vendor-1",
      productName: "Product",
      price: 100,
      currency: "usd",
      category: "test",
      timestamp: Date.now(),
    };

    const result = sanitize(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });
});
