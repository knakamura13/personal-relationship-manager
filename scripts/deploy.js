const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function deploy() {
  console.log("🚀 Starting deployment...");

  try {
    console.log("📋 Running Prisma migrations...");
    const { stdout, stderr } = await execPromise("npx prisma migrate deploy");
    console.log("Migration output:", stdout);
    if (stderr) console.log("Migration warnings:", stderr);

    console.log("✅ Migrations completed successfully!");
    console.log("🎯 Starting application...");

    // Start the Next.js app
    require("child_process").spawn("npm", ["start"], { stdio: "inherit" });
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

deploy();
