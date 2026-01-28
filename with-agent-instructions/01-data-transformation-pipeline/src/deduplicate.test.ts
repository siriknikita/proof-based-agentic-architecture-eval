/**
 * Tests for deduplication step
 */

import { deduplicateRecords } from "./deduplicate.js";
import type { ValidatedRecord } from "./types.js";
import { isOk } from "./result.js";

describe("deduplicateRecords", () => {
  it("should remove duplicate records", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1|v1", _timestamp: 1000 },
      { id: "2", _id: "2|v1", _timestamp: 2000 },
      { id: "1", _id: "1|v1", _timestamp: 1500 }, // Duplicate
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0]._id).toBe("1|v1");
      expect(result.value[1]._id).toBe("2|v1");
    }
  });

  it("should keep first occurrence of duplicates", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1|v1", _timestamp: 1000 },
      { id: "1", _id: "1|v1", _timestamp: 2000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]._timestamp).toBe(1000);
    }
  });

  it("should handle empty records array", () => {
    const records: ValidatedRecord[] = [];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it("should handle single record", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1|v1", _timestamp: 1000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]._id).toBe("1|v1");
    }
  });

  it("should handle many duplicates", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1|v1", _timestamp: 1000 },
      { id: "1", _id: "1|v1", _timestamp: 2000 },
      { id: "1", _id: "1|v1", _timestamp: 3000 },
      { id: "2", _id: "2|v1", _timestamp: 4000 },
      { id: "1", _id: "1|v1", _timestamp: 5000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0]._id).toBe("1|v1");
      expect(result.value[0]._timestamp).toBe(1000); // First occurrence
      expect(result.value[1]._id).toBe("2|v1");
    }
  });

  it("should preserve insertion order for unique records", () => {
    const records: ValidatedRecord[] = [
      { id: "3", _id: "3", _timestamp: 3000 },
      { id: "1", _id: "1", _timestamp: 1000 },
      { id: "2", _id: "2", _timestamp: 2000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("3");
      expect(result.value[1]._id).toBe("1");
      expect(result.value[2]._id).toBe("2");
    }
  });

  it("should handle records with empty identity", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "", _timestamp: 1000 },
      { id: "2", _id: "", _timestamp: 2000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // Both have empty identity, so only first is kept
      expect(result.value.length).toBe(1);
      expect(result.value[0]._timestamp).toBe(1000);
    }
  });

  it("should handle complex identity strings", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "product|vendor|region|2024", _timestamp: 1000 },
      { id: "2", _id: "product|vendor|region|2024", _timestamp: 2000 },
      { id: "3", _id: "product|vendor|region|2025", _timestamp: 3000 },
    ];

    const result = deduplicateRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(2);
      expect(result.value[0]._id).toBe("product|vendor|region|2024");
      expect(result.value[1]._id).toBe("product|vendor|region|2025");
    }
  });
});
