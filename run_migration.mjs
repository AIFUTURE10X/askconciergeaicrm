import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS property_count_range VARCHAR(20)`;
    console.log("Added: property_count_range");
  } catch (e) { console.log("Error:", e.message); }

  try {
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS current_system VARCHAR(100)`;
    console.log("Added: current_system");
  } catch (e) { console.log("Error:", e.message); }

  try {
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS pain_point VARCHAR(255)`;
    console.log("Added: pain_point");
  } catch (e) { console.log("Error:", e.message); }

  try {
    await sql`ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50)`;
    console.log("Added: lead_source");
  } catch (e) { console.log("Error:", e.message); }
}

run();
