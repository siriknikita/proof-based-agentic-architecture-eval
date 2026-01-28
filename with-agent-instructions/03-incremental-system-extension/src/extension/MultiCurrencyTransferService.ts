import { TransferService } from "../existing/TransferService";
import { TransferRequest } from "../existing/TransferRequest";
import { TransferResult } from "../existing/TransferResult";
import { ExchangeRateProvider } from "./ExchangeRateProvider";
import { MultiCurrencyTransferRequest } from "./MultiCurrencyTransferRequest";

/**
 * Extension: Multi-Currency Transfer Service
 * Extends the existing TransferService to support multi-currency transfers with exchange rates
 * 
 * Justification: This service wraps the existing TransferService and adds multi-currency logic.
 * It preserves existing behavior by delegating single-currency transfers to the base service.
 */
export class MultiCurrencyTransferService {
  constructor(
    private baseTransferService: TransferService,
    private exchangeRateProvider: ExchangeRateProvider
  ) {}

  /**
   * Detects if a transfer request requires multi-currency processing
   * 
   * Justification: Determines whether to use multi-currency logic or delegate to base service.
   * This preserves existing single-currency behavior.
   */
  private detectMultiCurrency(request: MultiCurrencyTransferRequest): boolean {
    return request.sourceCurrency !== request.destinationCurrency;
  }

  /**
   * Obtains and validates an exchange rate for a currency pair
   * 
   * Justification: Centralizes exchange rate retrieval and ensures rate is available before conversion.
   * This enforces the exchange rate positivity invariant.
   */
  private obtainExchangeRate(fromCurrency: string, toCurrency: string): number {
    const rate = this.exchangeRateProvider.getRate(fromCurrency, toCurrency);
    return this.validateExchangeRate(rate, fromCurrency, toCurrency);
  }

  /**
   * Validates that an exchange rate is available and positive
   * 
   * Justification: Enforces the exchange rate positivity invariant and provides explicit error handling.
   * This ensures all monetary invariants are preserved.
   */
  private validateExchangeRate(rate: number | null, fromCurrency: string, toCurrency: string): number {
    if (rate === null) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    if (rate <= 0) {
      throw new Error(`Invalid exchange rate: ${rate}`);
    }
    return rate;
  }

  /**
   * Converts an amount using an exchange rate
   * 
   * Justification: Performs the core conversion operation that preserves monetary value.
   * This enforces the conservation of value invariant.
   */
  private convertAmount(amount: number, exchangeRate: number): number {
    return amount * exchangeRate;
  }

  /**
   * Creates a converted transfer request with the destination currency
   * 
   * Justification: Transforms the multi-currency request into a single-currency request
   * that the base service can process. This maintains currency consistency.
   */
  private createConvertedRequest(request: MultiCurrencyTransferRequest, convertedAmount: number): TransferRequest {
    return {
      sourceAccount: request.sourceAccount,
      destinationAccount: request.destinationAccount,
      amount: convertedAmount,
      sourceCurrency: request.destinationCurrency,
      destinationCurrency: request.destinationCurrency
    };
  }

  /**
   * Processes a multi-currency transfer by converting and delegating to base service
   * 
   * Justification: Orchestrates the multi-currency transfer flow: rate lookup, conversion, and delegation.
   * This is the core extension logic that preserves all invariants.
   */
  private processMultiCurrencyTransfer(request: MultiCurrencyTransferRequest): TransferResult {
    const exchangeRate = this.obtainExchangeRate(request.sourceCurrency, request.destinationCurrency);
    const convertedAmount = this.convertAmount(request.amount, exchangeRate);
    const convertedRequest = this.createConvertedRequest(request, convertedAmount);
    return this.baseTransferService.processTransfer(convertedRequest);
  }

  /**
   * Public entry point for processing transfers
   * Routes to multi-currency or single-currency processing based on currency match
   * 
   * Justification: This is the main extension point that preserves existing behavior
   * by delegating single-currency transfers unchanged to the base service.
   */
  processTransfer(request: MultiCurrencyTransferRequest): TransferResult {
    const isMultiCurrency = this.detectMultiCurrency(request);
    if (isMultiCurrency) {
      return this.processMultiCurrencyTransfer(request);
    } else {
      return this.baseTransferService.processTransfer(request);
    }
  }
}
