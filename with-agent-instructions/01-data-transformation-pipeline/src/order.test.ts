/**
 * Tests for ordering step
 */

import { orderRecords } from "./order.js";
import type { ValidatedRecord } from "./types.js";
import { isOk } from "./result.js";

describe("orderRecords", () => {
  it("should order records by timestamp", () => {
    const records: ValidatedRecord[] = [
      { id: "3", _id: "3", _timestamp: 3000 },
      { id: "1", _id: "1", _timestamp: 1000 },
      { id: "2", _id: "2", _timestamp: 2000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(1000);
      expect(result.value[1]._timestamp).toBe(2000);
      expect(result.value[2]._timestamp).toBe(3000);
    }
  });

  it("should use identity for stable ordering when timestamps are equal", () => {
    const records: ValidatedRecord[] = [
      { id: "b", _id: "b", _timestamp: 1000 },
      { id: "a", _id: "a", _timestamp: 1000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("a");
      expect(result.value[1]._id).toBe("b");
    }
  });

  it("should handle empty records array", () => {
    const records: ValidatedRecord[] = [];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(0);
    }
  });

  it("should handle single record", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1", _timestamp: 1000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.length).toBe(1);
      expect(result.value[0]._id).toBe("1");
    }
  });

  it("should handle negative timestamps", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1", _timestamp: 1000 },
      { id: "2", _id: "2", _timestamp: -500 },
      { id: "3", _id: "3", _timestamp: 2000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(-500);
      expect(result.value[1]._timestamp).toBe(1000);
      expect(result.value[2]._timestamp).toBe(2000);
    }
  });

  it("should handle zero timestamps", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1", _timestamp: 0 },
      { id: "2", _id: "2", _timestamp: 1000 },
      { id: "3", _id: "3", _timestamp: 0 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(0);
      expect(result.value[1]._timestamp).toBe(0);
      expect(result.value[2]._timestamp).toBe(1000);
      // When timestamps are equal, order by identity
      expect(result.value[0]._id < result.value[1]._id).toBe(true);
    }
  });

  it("should handle very large timestamps", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "1", _timestamp: Number.MAX_SAFE_INTEGER },
      { id: "2", _id: "2", _timestamp: 1000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._timestamp).toBe(1000);
      expect(result.value[1]._timestamp).toBe(Number.MAX_SAFE_INTEGER);
    }
  });

  it("should maintain stable sort for equal timestamps", () => {
    const records: ValidatedRecord[] = [
      { id: "z", _id: "z", _timestamp: 1000 },
      { id: "a", _id: "a", _timestamp: 1000 },
      { id: "m", _id: "m", _timestamp: 1000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]._id).toBe("a");
      expect(result.value[1]._id).toBe("m");
      expect(result.value[2]._id).toBe("z");
    }
  });

  it("should not mutate input array", () => {
    const records: ValidatedRecord[] = [
      { id: "3", _id: "3", _timestamp: 3000 },
      { id: "1", _id: "1", _timestamp: 1000 },
    ];

    const originalOrder = records.map((r) => r._id);
    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    // Original array should be unchanged
    expect(records.map((r) => r._id)).toEqual(originalOrder);
  });

  it("should handle records with same timestamp and same identity", () => {
    const records: ValidatedRecord[] = [
      { id: "1", _id: "same", _timestamp: 1000 },
      { id: "2", _id: "same", _timestamp: 1000 },
    ];

    const result = orderRecords(records);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // Should maintain order when both timestamp and identity are equal
      expect(result.value.length).toBe(2);
    }
  });
});
