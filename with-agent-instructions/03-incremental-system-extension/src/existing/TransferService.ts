import { TransferRequest } from "./TransferRequest";
import { TransferResult } from "./TransferResult";

/**
 * Existing system: Transfer service
 * Processes single-currency transfers
 * This is the existing system that must remain unchanged
 */
export class TransferService {
  processTransfer(request: TransferRequest): TransferResult {
    // Validate that currencies match (existing single-currency requirement)
    if (request.sourceCurrency !== request.destinationCurrency) {
      return {
        success: false,
        message: "Source and destination currencies must match for single-currency transfers"
      };
    }

    // Validate amount
    if (request.amount <= 0) {
      return {
        success: false,
        message: "Transfer amount must be positive"
      };
    }

    // Process the transfer (simplified - in real system would interact with accounts)
    // This represents the existing behavior that must be preserved
    return {
      success: true,
      message: `Transferred ${request.amount} ${request.sourceCurrency} from ${request.sourceAccount} to ${request.destinationAccount}`,
      transactionId: `TXN-${Date.now()}`
    };
  }
}
