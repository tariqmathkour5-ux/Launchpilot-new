import { prisma } from "../src/lib/prisma";
import { randomBytes } from "crypto";

// Generate a secure API token for a merchant partner
function generateApiToken(): string {
  return randomBytes(32).toString("hex");
}

async function generateTokens() {
  console.log("Generating API tokens for Affiliate Partners...\n");

  const partners = await prisma.affiliatePartner.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      apiToken: true,
    },
  });

  console.log(`Found ${partners.length} partners.\n`);

  for (const partner of partners) {
    if (!partner.apiToken) {
      const token = generateApiToken();
      await prisma.affiliatePartner.update({
        where: { id: partner.id },
        data: { apiToken: token },
      });
      console.log(`Generated token for ${partner.name} (${partner.email}):`);
      console.log(`  Token: ${token}`);
      console.log(`  API URL: /admin/merchant-analytics?token=${token}`);
      console.log();
    } else {
      console.log(`${partner.name} (${partner.email}) already has a token:`);
      console.log(`  API URL: /admin/merchant-analytics?token=${partner.apiToken}`);
      console.log();
    }
  }

  console.log("Done!");
}

// Add a new partner with token
async function addPartner(name: string, email: string, commission: number = 10.0) {
  const code = `PARTNER_${Date.now()}`;
  const token = generateApiToken();

  const partner = await prisma.affiliatePartner.create({
    data: {
      name,
      email,
      code,
      apiToken: token,
      commission,
      status: "ACTIVE",
    },
  });

  console.log(`Created new partner:`);
  console.log(`  Name: ${partner.name}`);
  console.log(`  Code: ${partner.code}`);
  console.log(`  API Token: ${partner.apiToken}`);
  console.log(`  API URL: /admin/merchant-analytics?token=${partner.apiToken}`);
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  if (command === "add" && process.argv[3] && process.argv[4]) {
    addPartner(process.argv[3], process.argv[4], parseFloat(process.argv[5] || "10.0")).catch(console.error);
  } else if (command === "generate") {
    generateTokens().catch(console.error);
  } else {
    console.log("Usage:");
    console.log("  npm run generate:merchant-tokens    # Generate tokens for existing partners");
    console.log("  npm run add:partner <name> <email> [commission]  # Add new partner");
    process.exit(1);
  }
}