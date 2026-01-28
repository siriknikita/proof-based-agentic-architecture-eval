import { TransferRequest } from "../existing/TransferRequest";

/**
 * Extension: Multi-Currency Transfer Request
 * Extends the existing TransferRequest to explicitly support different source and destination currencies
 * 
 * Justification: While TransferRequest already has sourceCurrency and destinationCurrency fields,
 * this type makes the multi-currency intent explicit and provides type safety for the extension.
 */
export interface MultiCurrencyTransferRequest extends TransferRequest {
  // Inherits all fields from TransferRequest
  // The extension uses this type to distinguish multi-currency transfers
}
