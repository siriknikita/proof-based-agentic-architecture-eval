/**
 * Tests for Result type utilities
 */

import { ok, err, isOk, isErr } from "./result.js";

describe("Result utilities", () => {
  describe("ok", () => {
    it("should create a success result", () => {
      const result = ok<string, Error>("test");

      expect(result.success).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe("test");
      }
    });

    it("should handle different value types", () => {
      const stringResult = ok("string");
      const numberResult = ok(42);
      const objectResult = ok({ key: "value" });
      const arrayResult = ok([1, 2, 3]);

      expect(isOk(stringResult) && stringResult.value).toBe("string");
      expect(isOk(numberResult) && numberResult.value).toBe(42);
      expect(isOk(objectResult) && objectResult.value).toEqual({
        key: "value",
      });
      expect(isOk(arrayResult) && arrayResult.value).toEqual([1, 2, 3]);
    });

    it("should handle null and undefined values", () => {
      const nullResult = ok<null, Error>(null);
      const undefinedResult = ok<undefined, Error>(undefined);

      expect(isOk(nullResult) && nullResult.value).toBe(null);
      expect(isOk(undefinedResult) && undefinedResult.value).toBe(undefined);
    });
  });

  describe("err", () => {
    it("should create an error result", () => {
      const error = new Error("test error");
      const result = err<string, Error>(error);

      expect(result.success).toBe(false);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });

    it("should handle different error types", () => {
      const errorResult = err<string, Error>(new Error("error"));
      const stringResult = err<string, string>("error string");
      const objectResult = err<string, { code: number }>({ code: 404 });

      expect(isErr(errorResult) && errorResult.error.message).toBe("error");
      expect(isErr(stringResult) && stringResult.error).toBe("error string");
      expect(isErr(objectResult) && objectResult.error.code).toBe(404);
    });
  });

  describe("isOk", () => {
    it("should return true for success results", () => {
      const result = ok("test");

      expect(isOk(result)).toBe(true);
    });

    it("should return false for error results", () => {
      const result = err<string, Error>(new Error("error"));

      expect(isOk(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const result = ok<string, Error>("test");

      if (isOk(result)) {
        // TypeScript should know result.value exists here
        expect(typeof result.value).toBe("string");
      }
    });
  });

  describe("isErr", () => {
    it("should return true for error results", () => {
      const result = err<string, Error>(new Error("error"));

      expect(isErr(result)).toBe(true);
    });

    it("should return false for success results", () => {
      const result = ok("test");

      expect(isErr(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const error = new Error("error");
      const result = err<string, Error>(error);

      if (isErr(result)) {
        // TypeScript should know result.error exists here
        expect(result.error).toBe(error);
      }
    });
  });

  describe("Result type behavior", () => {
    it("should allow union of error types", () => {
      type MyError = { type: "ERROR1" } | { type: "ERROR2" };
      const result1: { success: false; error: { type: "ERROR1" } } = {
        success: false,
        error: { type: "ERROR1" },
      };
      const result2: { success: false; error: { type: "ERROR2" } } = {
        success: false,
        error: { type: "ERROR2" },
      };

      expect(result1.error.type).toBe("ERROR1");
      expect(result2.error.type).toBe("ERROR2");
    });

    it("should work with generic constraints", () => {
      function process<T, E>(
        value: T,
      ): { success: true; value: T } | { success: false; error: E } {
        return ok<T, E>(value);
      }

      const result = process<string, Error>("test");
      expect(isOk(result)).toBe(true);
    });
  });
});
