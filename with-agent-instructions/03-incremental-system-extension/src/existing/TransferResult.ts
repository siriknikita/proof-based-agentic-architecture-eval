/**
 * Existing system: Transfer result
 * Represents the outcome of a transfer operation
 */
export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
}
