/**
 * Tests for sanitization step
 */

import { sanitizeRecords } from "./sanitize.js";
import type { VendorConfig } from "./types.js";
import { isOk } from "./result.js";

describe("sanitizeRecords", () => {
  const createConfig = (): VendorConfig => ({
    vendorId: "test",
    sanitizers: [
      {
        field: "name",
        sanitize: (value) => {
          if (typeof value === "string") {
            return value.trim();
          }
          return String(value ?? "");
        },
      },
    ],
    validators: [],
    identityFields: ["id"],
    orderingField: "timestamp",
  });

  it("should sanitize fields according to sanitizers", () => {
    const config = createConfig();
    const records = [{ name: "  test  ", id: "1" }];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].name).toBe("test");
    }
  });

  it("should preserve non-sanitized fields", () => {
    const config = createConfig();
    const records = [{ name: "test", id: "1", extra: "value" }];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].extra).toBe("value");
    }
  });

  it("should handle empty records array", () => {
    const config = createConfig();
    const records: any[] = [];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it("should handle null and undefined values", () => {
    const config = createConfig();
    const records = [
      { name: null, id: "1" },
      { name: undefined, id: "2" },
    ];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].name).toBe("");
      expect(result.value[1].name).toBe("");
    }
  });

  it("should handle multiple sanitizers on same record", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "name",
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
      validators: [],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ name: "  product  ", price: "100.50", id: "1" }];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].name).toBe("product");
      expect(result.value[0].price).toBe(100.5);
    }
  });

  it("should return error when sanitizer throws", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "name",
          sanitize: () => {
            throw new Error("Sanitization failed");
          },
        },
      ],
      validators: [],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ name: "test", id: "1" }];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(false);
    if (!isOk(result)) {
      expect(result.error.type).toBe("SANITIZATION_ERROR");
      expect(result.error.field).toBe("name");
      expect(result.error.recordIndex).toBe(0);
    }
  });

  it("should handle records with missing sanitized fields", () => {
    const config = createConfig();
    const records = [{ id: "1" }]; // Missing 'name' field

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0].name).toBe("");
    }
  });

  it("should handle multiple records with errors", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "name",
          sanitize: (value) => {
            if (String(value) === "test2")
              throw new Error("Error on second record");
            return String(value ?? "").trim();
          },
        },
      ],
      validators: [],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [
      { name: "test1", id: "1" },
      { name: "test2", id: "2" },
    ];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(false);
    if (!isOk(result)) {
      expect(result.error.type).toBe("SANITIZATION_ERROR");
      expect(result.error.recordIndex).toBe(1);
    }
  });

  it("should sanitize fields in order of sanitizer array", () => {
    const config: VendorConfig = {
      vendorId: "test",
      sanitizers: [
        {
          field: "value",
          sanitize: (value) => String(value ?? "").toUpperCase(),
        },
        {
          field: "value",
          sanitize: (value) => String(value).trim(),
        },
      ],
      validators: [],
      identityFields: ["id"],
      orderingField: "timestamp",
    };

    const records = [{ value: "  test  ", id: "1" }];

    const result = sanitizeRecords(records, config);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // Last sanitizer wins (each sanitizer gets original value, last one overwrites)
      expect(result.value[0].value).toBe("test");
    }
  });
});
