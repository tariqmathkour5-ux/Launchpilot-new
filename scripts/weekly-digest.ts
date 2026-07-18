// =====================================================
// Weekly Digest Script
// =====================================================
// Run this script to send the weekly tool digest via CLI
// Usage: npx ts-node --compiler-options {"module":"CommonJS"} scripts/weekly-digest.ts

import { sendWeeklyToolDigest } from "../src/lib/weekly-digest";

async function main() {
  console.log("📧 Sending weekly tool digest...\n");

  const result = await sendWeeklyToolDigest();

  console.log("\n📊 Results:");
  console.log(`   Total recipients: ${result.total}`);
  console.log(`   Successfully sent: ${result.success}`);
  console.log(`   Failed: ${result.failed}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error running weekly digest:", error);
  process.exit(1);
});