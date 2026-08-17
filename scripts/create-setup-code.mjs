import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to create an administrator setup code.");
}

const setupCode = randomBytes(24).toString("hex");
const setupCodeHash = createHash("sha256").update(setupCode).digest("hex");
const sql = postgres(databaseUrl, { max: 1, ssl: "require" });

try {
  await sql.begin(async (transaction) => {
    const rows = await transaction`SELECT count(*)::int AS count FROM users`;
    if (rows[0]?.count !== 0) {
      throw new Error("Administrator setup is already complete.");
    }
    await transaction`DELETE FROM admin_setup_tokens`;
    await transaction`
      INSERT INTO admin_setup_tokens (token_hash, expires_at)
      VALUES (${setupCodeHash}, now() + interval '24 hours')
    `;
  });
  console.log(setupCode);
} finally {
  await sql.end();
}
