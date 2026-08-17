import fs from "node:fs/promises";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const sql = postgres(databaseUrl, { max: 1, ssl: "require" });
try {
  const schema = await fs.readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await sql.unsafe(schema);
  console.log("Soni portal database is ready.");
} finally {
  await sql.end();
}
