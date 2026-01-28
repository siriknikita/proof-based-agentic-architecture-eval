/**
 * Tests for validation step
 */

import { validateRecords } from "./validate.js";
import type { VendorConfig } from "./types.js";
import { isOk, isErr } from "./result.js";

describe("validateRecords", () => {
  const createConfig = (): VendorConfig => ({
    vendorId: "test",
    sanitizers: [],
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

  it("should validate records according to validators", () => {
    const config = createConfig();
    const records = [{ id: "test", timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("test");
      expect(result.value[0]._timestamp).toBe(1000);
    }
  });

  it("should return error for invalid records", () => {
    const config = createConfig();
    const records = [{ id: "", timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  it("should handle empty records array", () => {
    const config = createConfig();
    const records: any[] = [];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it("should generate identity from multiple fields", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [],
      validators: [],
      identityFields: ["productId", "vendorId"],
      orderingField: "timestamp",
    };

    const records = [{ productId: "P001", vendorId: "V1", timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("P001|V1");
    }
  });

  it("should handle null/undefined in identity fields", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [],
      validators: [],
      identityFields: ["id", "vendor"],
      orderingField: "timestamp",
    };

    const records = [
      { id: "1", vendor: null, timestamp: 1000 },
      { id: undefined, vendor: "V1", timestamp: 2000 },
    ];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("1|");
      expect(result.value[1]._id).toBe("|V1");
    }
  });

  it("should handle numeric timestamp", () => {
    const config = createConfig();
    const records = [{ id: "test", timestamp: 1234567890 }];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(1234567890);
    }
  });

  it("should handle string timestamp", () => {
    const config = createConfig();
    const records = [{ id: "test", timestamp: "1234567890" }];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(1234567890);
    }
  });

  it("should fallback to index when timestamp is invalid", () => {
    const config = createConfig();
    const records = [
      { id: "test1", timestamp: "invalid" },
      { id: "test2", timestamp: null },
    ];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(0);
      expect(result.value[1]._timestamp).toBe(1);
    }
  });

  it("should validate multiple fields", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [],
      validators: [
        {
          field: "id",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "id must be non-empty string",
        },
        {
          field: "price",
          validate: (value) => typeof value === "number" && value >= 0,
          errorMessage: "price must be non-negative number",
        },
      ],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ id: "test", price: 100, timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
  });

  it("should return error on first validation failure", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [],
      validators: [
        {
          field: "id",
          validate: (value) => typeof value === "string" && value.length > 0,
          errorMessage: "id must be non-empty string",
        },
        {
          field: "price",
          validate: (value) => typeof value === "number" && value >= 0,
          errorMessage: "price must be non-negative number",
        },
      ],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ id: "", price: 100, timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect(result.error.field).toBe("id");
      expect(result.error.recordIndex).toBe(0);
    }
  });

  it("should include error message from validator", () => {
    const config = createConfig();
    const records = [{ id: "", timestamp: 1000 }];

    const result = validateRecords(records, config);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe("id must be non-empty string");
    }
  });

  it("should preserve all original fields in validated record", () => {
    const config = createConfig();
    const records = [
      { id: "test", timestamp: 1000, extra: "value", nested: { data: 123 } },
    ];

    const result = validateRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].extra).toBe("value");
      expect(result.value[0].nested).toEqual({ data: 123 });
      expect(result.value[0]._id).toBe("test");
      expect(result.value[0]._timestamp).toBe(1000);
    }
  });
});
