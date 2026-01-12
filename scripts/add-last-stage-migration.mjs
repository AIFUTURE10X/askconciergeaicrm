// Migration script to add last_stage column to deals table
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Running migration: add last_stage column to deals...");

  try {
    // Add last_stage column
    await sql`
      ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS last_stage VARCHAR(50)
    `;
    console.log("Added last_stage column to deals table");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
