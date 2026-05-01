import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = neon(url);

async function main() {
  console.log("Applying pending schema changes...");

  await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password_hash" text`;
  console.log("✓ Added password_hash to user");

  await sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "email_verified"`;
  await sql`ALTER TABLE "user" DROP COLUMN IF EXISTS "image"`;
  console.log("✓ Removed old columns from user");

  await sql`
    CREATE TABLE IF NOT EXISTS "appointment_materials" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "appointment_id" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE cascade,
      "material_id" uuid NOT NULL REFERENCES "materials"("id") ON DELETE cascade,
      "quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log("✓ Created appointment_materials table");

  await sql`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "preferred_cabinet_id" uuid REFERENCES "cabinets"("id") ON DELETE set null`;
  console.log("✓ Added preferred_cabinet_id to clients");

  await sql`DROP TABLE IF EXISTS "account" CASCADE`;
  await sql`DROP TABLE IF EXISTS "session" CASCADE`;
  await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
  console.log("✓ Dropped old auth tables");

  console.log("\n✓ All done!");
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
