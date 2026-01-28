/**
 * Example usage of the data transformation pipeline
 */

import { DataTransformationPipeline } from "./pipeline.js";
import type { RawVendorRecord } from "./types.js";

// Example raw records with various issues
const rawRecords: RawVendorRecord[] = [
  // Well-formed record
  {
    productId: "prod-001",
    vendorId: "vendor-abc",
    productName: "Laptop Computer",
    price: 999.99,
    currency: "USD",
    category: "electronics",
    description: "High-performance laptop",
    timestamp: Date.now() - 10000,
  },

  // Record with alternative field names
  {
    product_id: "prod-002",
    vendor_id: "vendor-xyz",
    product_name: "Wireless Mouse",
    price: "29.99", // String price
    currency: "usd", // Lowercase currency
    category: "accessories",
    timestamp: Date.now() - 5000,
  },

  // Record with whitespace issues
  {
    productId: "  prod-003  ",
    vendorId: "  vendor-abc  ",
    productName: "  Keyboard  ",
    price: 79.99,
    currency: "EUR",
    category: "accessories",
    timestamp: Date.now(),
  },

  // Duplicate record (same productId + vendorId, different timestamp)
  {
    productId: "prod-001",
    vendorId: "vendor-abc",
    productName: "Laptop Computer Updated",
    price: 899.99, // Updated price
    currency: "USD",
    category: "electronics",
    description: "Updated description",
    timestamp: Date.now(), // Newer timestamp
  },

  // Record with metadata
  {
    productId: "prod-004",
    vendorId: "vendor-xyz",
    productName: "USB Cable",
    price: 12.99,
    currency: "GBP",
    category: "accessories",
    timestamp: Date.now() - 2000,
    customField: "customValue",
    anotherField: 123,
  },

  // Invalid record (missing required field)
  {
    vendorId: "vendor-abc",
    productName: "Invalid Product",
    price: 50.0,
    currency: "USD",
    category: "test",
    timestamp: Date.now(),
    // Missing productId - will fail
  },
];

async function main() {
  console.log("=== Data Transformation Pipeline Example ===\n");

  // Create pipeline
  const pipeline = new DataTransformationPipeline({
    continueOnError: true, // Continue processing even if some records fail
  });

  console.log(`Processing ${rawRecords.length} raw records...\n`);

  // Process records
  const result = pipeline.process(rawRecords);

  // Display results
  console.log("=== Processing Results ===");
  console.log(`Total records: ${result.stats.total}`);
  console.log(`Sanitized: ${result.stats.sanitized}`);
  console.log(`Validated: ${result.stats.validated}`);
  console.log(`Deduplicated: ${result.stats.deduplicated}`);
  console.log(`Ordered: ${result.stats.ordered}`);
  console.log(`Failed: ${result.stats.failed}`);
  console.log();

  // Display successful records
  console.log(
    `=== Successfully Processed Records (${result.records.length}) ===`,
  );
  result.records.forEach((record, index) => {
    console.log(`\n${index + 1}. ${record.productName}`);
    console.log(`   Product ID: ${record.productId}`);
    console.log(`   Vendor ID: ${record.vendorId}`);
    console.log(`   Price: ${record.currency} ${record.price}`);
    console.log(`   Category: ${record.category}`);
    console.log(`   Timestamp: ${new Date(record.timestamp).toISOString()}`);
    if (Object.keys(record.metadata).length > 0) {
      console.log(`   Metadata: ${JSON.stringify(record.metadata)}`);
    }
  });

  // Display errors
  if (result.errors.length > 0) {
    console.log(`\n=== Errors (${result.errors.length}) ===`);
    result.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. Stage: ${error.stage}`);
      console.log(`   Reason: ${error.reason}`);
      console.log(`   Record: ${JSON.stringify(error.record, null, 2)}`);
    });
  }

  console.log("\n=== Example Complete ===");
}

// Run example
main().catch(console.error);
