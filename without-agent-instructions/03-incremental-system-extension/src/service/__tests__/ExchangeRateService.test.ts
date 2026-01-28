import {
  IExchangeRateService,
  InMemoryExchangeRateService,
} from "../ExchangeRateService";

describe("InMemoryExchangeRateService", () => {
  let service: InMemoryExchangeRateService;

  beforeEach(() => {
    service = new InMemoryExchangeRateService();
  });

  describe("getExchangeRate", () => {
    it("should return 1.0 for same currency", () => {
      expect(service.getExchangeRate("USD", "USD")).toBe(1.0);
      expect(service.getExchangeRate("EUR", "EUR")).toBe(1.0);
    });

    it("should return correct exchange rate for different currencies", () => {
      const rate = service.getExchangeRate("USD", "EUR");
      expect(rate).toBeGreaterThan(0);
      expect(typeof rate).toBe("number");
    });

    it("should throw error for unavailable exchange rate", () => {
      expect(() => {
        service.getExchangeRate("USD", "JPY");
      }).toThrow("Exchange rate not available");
    });
  });

  describe("convertAmount", () => {
    it("should return same amount for same currency", () => {
      expect(service.convertAmount(100, "USD", "USD")).toBe(100);
    });

    it("should convert amount using exchange rate", () => {
      // USD to EUR: 100 * 0.85 = 85.00
      const converted = service.convertAmount(100, "USD", "EUR");
      expect(converted).toBe(85.0);
    });

    it("should round to 2 decimal places", () => {
      service.setRate("USD", "TEST", 0.333333);
      const converted = service.convertAmount(100, "USD", "TEST");
      expect(converted).toBe(33.33);
    });

    it("should throw error for negative amount", () => {
      expect(() => {
        service.convertAmount(-100, "USD", "EUR");
      }).toThrow("Amount cannot be negative");
    });

    it("should throw error for unavailable exchange rate", () => {
      expect(() => {
        service.convertAmount(100, "USD", "JPY");
      }).toThrow("Exchange rate not available");
    });
  });

  describe("setRate", () => {
    it("should allow setting custom exchange rates", () => {
      service.setRate("USD", "JPY", 110.0);
      expect(service.getExchangeRate("USD", "JPY")).toBe(110.0);
    });

    it("should reject negative exchange rates", () => {
      expect(() => {
        service.setRate("USD", "JPY", -1);
      }).toThrow("Exchange rate must be positive");
    });

    it("should reject zero exchange rates", () => {
      expect(() => {
        service.setRate("USD", "JPY", 0);
      }).toThrow("Exchange rate must be positive");
    });

    it("should enforce rate of 1.0 for same currency", () => {
      expect(() => {
        service.setRate("USD", "USD", 2.0);
      }).toThrow("Exchange rate for same currency must be 1.0");
    });
  });
});
