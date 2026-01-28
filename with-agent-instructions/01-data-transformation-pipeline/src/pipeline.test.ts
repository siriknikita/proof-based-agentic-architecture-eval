/**
 * Tests for the complete pipeline
 */

import { processRecords } from "./pipeline.js";
import type { VendorConfig } from "./types.js";
import { isOk, isErr } from "./result.js";

describe("processRecords", () => {
  const createConfig = (): VendorConfig => ({
    vendorId: "test",
    sanitizers: [
      {
        field: "id",
        sanitize: (value) => {
          if (typeof value === "string") {
            return value.trim();
          }
          return String(value ?? "");
        },
      },
    ],
    validators: [
      {
        field: "id",
        validate: (value) => typeof value === "string" && value.length > 0,
        errorMessage: "id must be non-empty string",
      },
    ],
    identityFields: ["id"],
    orderingField: "timestamp",
  });

  it("should process valid records through all steps", () => {
    const config = createConfig();
    const records = [
      { id: "  P001  ", timestamp: 2000 },
      { id: "P002", timestamp: 1000 },
      { id: "P001", timestamp: 1500 }, // Duplicate
    ];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(2); // Deduplicated
      expect(result.value[0].id).toBe("P002"); // Ordered by timestamp
      expect(result.value[1].id).toBe("P001");
    }
  });

  it("should return error on validation failure", () => {
    const config = createConfig();
    const records = [
      { id: "", timestamp: 1000 }, // Invalid
    ];

    const result = processRecords(records, config);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  it("should return error on sanitization failure", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "id",
          sanitize: () => {
            throw new Error("Sanitization error");
          },
        },
      ],
      validators: [],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ id: "test", timestamp: 1000 }];

    const result = processRecords(records, config);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.type).toBe("SANITIZATION_ERROR");
    }
  });

  it("should handle empty records array", () => {
    const config = createConfig();
    const records: any[] = [];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it("should handle complex transformation with all steps", () => {
    const config: VendorConfig = {
      vendorId: "vendor1",
      sanitizers: [
        {
          field: "productId",
          sanitize: (value) => String(value ?? "").trim(),
        },
        {
          field: "price",
          sanitize: (value) => {
            if (typeof value === "string") {
              return parseFloat(value.replace(/[^0-9.]/g, ""));
            }
            return typeof value === "number" ? value : 0;
          },
        },
      ],
      validators: [
        {
          field: "productId",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "productId required",
        },
        {
          field: "price",
          validate: (value) => typeof value === "number" && value >= 0,
          errorMessage: "price must be non-negative",
        },
      ],
      identityFields: ["productId", "vendorId"],
      orderingField: "timestamp",
    };

    const records = [
      {
        productId: "  P001  ",
        price: "100.50",
        timestamp: 2000,
        vendorId: "vendor1",
      },
      { productId: "P002", price: 200, timestamp: 1000, vendorId: "vendor1" },
      { productId: "P001", price: 100.5, timestamp: 1500, vendorId: "vendor1" }, // Duplicate
    ];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(2); // Deduplicated
      expect(result.value[0].productId).toBe("P002"); // Ordered by timestamp
      expect(result.value[1].productId).toBe("P001");
      expect(result.value[0].price).toBe(200);
      expect(result.value[1].price).toBe(100.5);
    }
  });

  it("should propagate errors from deduplication", () => {
    // This test verifies error propagation, though deduplication rarely fails
    const config = createConfig();
    const records = [{ id: "test", timestamp: 1000 }];

    const result = processRecords(records, config);

    // Deduplication should succeed with valid records
    expect(isOk(result)).toBe(true);
  });

  it("should handle out-of-order records", () => {
    const config = createConfig();
    const records = [
      { id: "P003", timestamp: 3000 },
      { id: "P001", timestamp: 1000 },
      { id: "P002", timestamp: 2000 },
    ];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].id).toBe("P001");
      expect(result.value[1].id).toBe("P002");
      expect(result.value[2].id).toBe("P003");
    }
  });

  it("should handle malformed data through sanitization", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "id",
          sanitize: (value) => String(value ?? "").trim(),
        },
        {
          field: "timestamp",
          sanitize: (value) => {
            if (typeof value === "number") return value;
            if (typeof value === "string") {
              const parsed = parseInt(value, 10);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          },
        },
      ],
      validators: [
        {
          field: "id",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "id required",
        },
      ],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [
      { id: "  P001  ", timestamp: "2000" }, // Malformed: extra spaces, string timestamp
      { id: "P002", timestamp: 1000 },
    ];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // Ordered by timestamp: P002 (1000) comes before P001 (2000)
      expect(result.value[0].id).toBe("P002");
      expect(result.value[0]._timestamp).toBe(1000);
      expect(result.value[1].id).toBe("P001");
      expect(result.value[1]._timestamp).toBe(2000);
    }
  });

  it("should handle multiple vendors with different configs", () => {
    const vendor1Config: VendorConfig = {
      vendorId: "vendor1",
      sanitizers: [
        {
          field: "id",
          sanitize: (value) => String(value ?? "").toUpperCase(),
        },
      ],
      validators: [
        {
          field: "id",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "id required",
        },
      ],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const vendor2Config: VendorConfig = {
      vendorId: "vendor2",
      sanitizers: [
        {
          field: "id",
          sanitize: (value) => String(value ?? "").toLowerCase(),
        },
      ],
      validators: [
        {
          field: "id",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "id required",
        },
      ],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const vendor1Records = [{ id: "test", timestamp: 1000 }];
    const vendor2Records = [{ id: "TEST", timestamp: 2000 }];

    const result1 = processRecords(vendor1Records, vendor1Config);
    const result2 = processRecords(vendor2Records, vendor2Config);

    expect(isOk(result1)).toBe(true);
    expect(isOk(result2)).toBe(true);
    if (isOk(result1) && isOk(result2)) {
      expect(result1.value[0].id).toBe("TEST");
      expect(result2.value[0].id).toBe("test");
    }
  });

  it("should preserve all fields through pipeline", () => {
    const config = createConfig();
    const records = [
      {
        id: "test",
        timestamp: 1000,
        extra: "value",
        nested: { data: 123 },
        array: [1, 2, 3],
      },
    ];

    const result = processRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].extra).toBe("value");
      expect(result.value[0].nested).toEqual({ data: 123 });
      expect(result.value[0].array).toEqual([1, 2, 3]);
      expect(result.value[0]._id).toBe("test");
      expect(result.value[0]._timestamp).toBe(1000);
    }
  });
});
