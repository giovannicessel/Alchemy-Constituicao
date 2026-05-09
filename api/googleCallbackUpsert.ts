import mysql, { type Connection } from "mysql2/promise";

/**
 * Upsert mínimo só para o callback Google na Vercel — evita importar `server/db`
 * (drizzle + schema inteiro → bundle pesado / crash da função).
 */
export async function upsertGoogleOAuthUser(input: {
  openId: string;
  name: string | null;
  email: string | null;
}): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.warn("[googleCallbackUpsert] DATABASE_URL ausente — utilizador não gravado na BD");
    return;
  }

  const ownerOpenId = process.env.OWNER_OPEN_ID?.trim();
  const role = ownerOpenId && input.openId === ownerOpenId ? "admin" : "user";

  let conn: Connection | undefined;
  try {
    conn = await mysql.createConnection(databaseUrl);
    await conn.execute(
      `INSERT INTO users (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`lastSignedIn\`, \`role\`, \`createdAt\`, \`updatedAt\`)
       VALUES (?, ?, ?, 'google', NOW(), ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         \`name\` = VALUES(\`name\`),
         \`email\` = VALUES(\`email\`),
         \`loginMethod\` = VALUES(\`loginMethod\`),
         \`lastSignedIn\` = VALUES(\`lastSignedIn\`),
         \`role\` = VALUES(\`role\`),
         \`updatedAt\` = NOW()`,
      [input.openId, input.name, input.email, role],
    );
  } finally {
    if (conn) await conn.end();
  }
}
