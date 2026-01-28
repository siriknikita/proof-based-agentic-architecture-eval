/**
 * Example usage of the data transformation pipeline
 */

import { processRecords, type VendorConfig } from "./index.js";
import { isOk } from "./result.js";

// Example vendor configuration
export function createExampleVendorConfig(): VendorConfig {
  return {
    vendorId: "example-vendor",
    sanitizers: [
      {
        field: "productId",
        sanitize: (value) => {
          if (typeof value === "string") {
            return value.trim();
          }
          if (typeof value === "number") {
            return String(value);
          }
          return String(value ?? "");
        },
      },
      {
        field: "price",
        sanitize: (value) => {
          if (typeof value === "number") {
            return value;
          }
          if (typeof value === "string") {
            const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        },
      },
      {
        field: "timestamp",
        sanitize: (value) => {
          if (typeof value === "number") {
            return value;
          }
          if (typeof value === "string") {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        },
      },
    ],
    validators: [
      {
        field: "productId",
        validate: (value) => typeof value === "string" && value.length > 0,
        errorMessage: "productId must be a non-empty string",
      },
      {
        field: "price",
        validate: (value) => typeof value === "number" && value >= 0,
        errorMessage: "price must be a non-negative number",
      },
    ],
    identityFields: ["productId", "vendorId"],
    orderingField: "timestamp",
  };
}

// Example usage
const exampleRecords = [
  {
    productId: "  P001  ",
    price: "100.50",
    timestamp: 1000,
    vendorId: "vendor1",
  },
  { productId: "P002", price: 200, timestamp: 2000, vendorId: "vendor1" },
  { productId: "P001", price: 100.5, timestamp: 1500, vendorId: "vendor1" }, // Duplicate
  { productId: "P003", price: -50, timestamp: 3000, vendorId: "vendor1" }, // Invalid price
  { productId: "", price: 300, timestamp: 2500, vendorId: "vendor1" }, // Invalid productId
];

const config = createExampleVendorConfig();
const result = processRecords(exampleRecords, config);

if (isOk(result)) {
  console.log("Successfully processed records:");
  console.log(JSON.stringify(result.value, null, 2));
} else {
  console.error("Pipeline error:", result.error);
}
