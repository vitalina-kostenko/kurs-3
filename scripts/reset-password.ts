import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = neon(url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

async function main() {
  const email = await ask("Email: ");
  const password = await ask("New password: ");
  rl.close();

  const [user] = await sql`SELECT id, email FROM "user" WHERE email = ${email}`;
  if (!user) {
    console.error(`✗ User "${email}" not found`);
    process.exit(1);
  }

  const passwordHash = await hash(password, 12);
  await sql`UPDATE "user" SET password_hash = ${passwordHash} WHERE email = ${email}`;

  console.log(`✓ Password updated for ${email}`);
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
