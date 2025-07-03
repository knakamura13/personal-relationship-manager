const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function migrateProduction() {
  console.log("🔗 Connecting to production database...");

  // Get DATABASE_URL from command line argument
  const databaseUrl = process.argv[2];

  if (!databaseUrl) {
    console.error("❌ Please provide DATABASE_URL as argument:");
    console.error(
      'node scripts/migrate-production.js "postgresql://user:pass@host:port/db"'
    );
    process.exit(1);
  }

  // Set environment variable for this process
  process.env.DATABASE_URL = databaseUrl;

  try {
    console.log("📋 Running Prisma migrations against production database...");
    const { stdout, stderr } = await execPromise("npx prisma migrate deploy");

    console.log("✅ Migration output:");
    console.log(stdout);

    if (stderr) {
      console.log("⚠️  Warnings:");
      console.log(stderr);
    }

    console.log("🎉 Production database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error.message);
    if (error.stdout) console.log("stdout:", error.stdout);
    if (error.stderr) console.log("stderr:", error.stderr);
    process.exit(1);
  }
}

migrateProduction();
