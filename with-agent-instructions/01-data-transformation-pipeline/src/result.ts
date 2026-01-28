/**
 * Result type utilities for explicit error handling
 */

import type { Result } from "./types.js";

export function ok<T, E>(value: T): Result<T, E> {
  return { success: true, value };
}

export function err<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { success: true; value: T } {
  return result.success === true;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { success: false; error: E } {
  return result.success === false;
}
