/**
 * Extension: Exchange Rate Provider interface
 * Provides exchange rates for currency pairs
 * 
 * Justification: Required to obtain conversion rates for multi-currency transfers.
 * This abstraction allows for different implementations (in-memory, API, database).
 */
export interface ExchangeRateProvider {
  /**
   * Gets the exchange rate from one currency to another
   * @param fromCurrency Source currency code
   * @param toCurrency Destination currency code
   * @returns Exchange rate (positive number) or null if rate is not available
   */
  getRate(fromCurrency: string, toCurrency: string): number | null;
}
