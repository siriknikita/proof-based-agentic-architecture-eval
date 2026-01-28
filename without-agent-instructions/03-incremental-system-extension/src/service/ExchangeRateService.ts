/**
 * Service for managing exchange rates and currency conversions.
 * 
 * This service provides exchange rate lookup and currency conversion functionality.
 * It is isolated from the existing transfer system to allow for future extensions
 * (e.g., API-based rate providers, database-backed rates, etc.).
 */
export interface IExchangeRateService {
  /**
   * Gets the exchange rate from one currency to another.
   * @param fromCurrency Source currency code (e.g., "USD")
   * @param toCurrency Destination currency code (e.g., "EUR")
   * @returns Exchange rate (amount in toCurrency per 1 unit of fromCurrency)
   * @throws Error if exchange rate is not available or currencies are invalid
   */
  getExchangeRate(fromCurrency: string, toCurrency: string): number;

  /**
   * Converts an amount from one currency to another.
   * @param amount Amount to convert
   * @param fromCurrency Source currency code
   * @param toCurrency Destination currency code
   * @returns Converted amount in destination currency
   * @throws Error if exchange rate is not available or currencies are invalid
   */
  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number;
}

/**
 * In-memory implementation of ExchangeRateService.
 * 
 * This implementation uses a simple map-based storage for exchange rates.
 * In a production system, this could be replaced with an API-based provider
 * or database-backed service.
 */
export class InMemoryExchangeRateService implements IExchangeRateService {
  private rates: Map<string, number> = new Map();

  constructor() {
    // Initialize with some common exchange rates
    // Format: "FROM_TO" -> rate
    this.setRate("USD", "EUR", 0.85);
    this.setRate("EUR", "USD", 1.18);
    this.setRate("USD", "GBP", 0.73);
    this.setRate("GBP", "USD", 1.37);
    this.setRate("EUR", "GBP", 0.86);
    this.setRate("GBP", "EUR", 1.16);
    
    // Same currency always has rate of 1.0
    this.setRate("USD", "USD", 1.0);
    this.setRate("EUR", "EUR", 1.0);
    this.setRate("GBP", "GBP", 1.0);
  }

  /**
   * Sets an exchange rate between two currencies.
   * This method is provided for testing and configuration purposes.
   */
  setRate(fromCurrency: string, toCurrency: string, rate: number): void {
    if (rate <= 0) {
      throw new Error("Exchange rate must be positive");
    }
    if (fromCurrency === toCurrency && rate !== 1.0) {
      throw new Error("Exchange rate for same currency must be 1.0");
    }
    const key = this.getRateKey(fromCurrency, toCurrency);
    this.rates.set(key, rate);
  }

  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const key = this.getRateKey(fromCurrency, toCurrency);
    const rate = this.rates.get(key);

    if (rate === undefined) {
      throw new Error(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`
      );
    }

    return rate;
  }

  convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    const converted = amount * rate;

    // Round to 2 decimal places (standard financial precision)
    return Math.round(converted * 100) / 100;
  }

  private getRateKey(fromCurrency: string, toCurrency: string): string {
    return `${fromCurrency}_${toCurrency}`;
  }
}
