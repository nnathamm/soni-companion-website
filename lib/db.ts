import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("portal_not_configured");
  if (!client) {
    client = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      prepare: false,
    });
  }
  return client;
}
