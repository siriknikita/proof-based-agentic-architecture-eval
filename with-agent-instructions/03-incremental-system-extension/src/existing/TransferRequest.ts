import { Money } from "./Money";

/**
 * Existing system: Transfer request
 * Represents a request to transfer money from source to destination
 */
export interface TransferRequest {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
}
