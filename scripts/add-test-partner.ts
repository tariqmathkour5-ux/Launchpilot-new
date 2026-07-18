import { prisma } from "../src/lib/prisma";
import { randomBytes } from "crypto";

async function addTestPartner() {
  const token = randomBytes(32).toString("hex");
  const code = `TEST_PARTNER_${Date.now()}`;

  const partner = await prisma.affiliatePartner.create({
    data: {
      name: "Test Merchant",
      email: "test-merchant@example.com",
      code,
      apiToken: token,
      commission: 15.0,
      status: "ACTIVE",
    },
  });

  console.log("Created test partner:");
  console.log(`  Name: ${partner.name}`);
  console.log(`  Email: ${partner.email}`);
  console.log(`  Code: ${partner.code}`);
  console.log(`  API Token: ${partner.apiToken}`);
  console.log(`  Portal URL: /admin/merchant-analytics?token=${partner.apiToken}`);
}

addTestPartner().catch(console.error);