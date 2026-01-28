import { ExchangeRateProvider } from "./ExchangeRateProvider";

/**
 * Extension: In-Memory Exchange Rate Provider
 * Simple implementation for demonstration purposes
 * 
 * Justification: Provides a concrete implementation of ExchangeRateProvider
 * for testing and demonstration. In production, this would be replaced with
 * an API-based or database-backed implementation.
 */
export class InMemoryExchangeRateProvider implements ExchangeRateProvider {
  private rates: Map<string, number> = new Map();

  constructor(initialRates?: Array<{ from: string; to: string; rate: number }>) {
    if (initialRates) {
      initialRates.forEach(({ from, to, rate }) => {
        this.setRate(from, to, rate);
      });
    }
  }

  getRate(fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) {
      return 1.0;
    }
    const key = `${fromCurrency}_${toCurrency}`;
    return this.rates.get(key) ?? null;
  }

  setRate(fromCurrency: string, toCurrency: string, rate: number): void {
    if (rate <= 0) {
      throw new Error("Exchange rate must be positive");
    }
    const key = `${fromCurrency}_${toCurrency}`;
    this.rates.set(key, rate);
  }
}
