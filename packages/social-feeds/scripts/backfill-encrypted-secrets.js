const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const ENCRYPTION_PREFIX = "enc:v1:";
const ENCRYPTION_SALT = "social-feeds-secret-crypto";
const IV_LENGTH = 12;

const USER_SECRET_FIELDS = [
  "openaiApiKey",
  "googleApiKey",
  "abacusApiKey",
  "openrouterApiKey",
  "linkedinClientSecret",
  "facebookAppSecret",
  "twitterClientSecret",
  "tiktokClientSecret",
  "youtubeClientSecret",
  "pinterestClientSecret",
  "threadsClientSecret",
  "mfaSecret",
  "mfaPendingSecret",
];

const normalizeSecretMaterial = (value) =>
  (value || "").trim().replace(/^["']|["']$/g, "");

const getEncryptionKey = () => {
  const secretMaterial =
    normalizeSecretMaterial(process.env.SECRET_ENCRYPTION_KEY) ||
    normalizeSecretMaterial(process.env.NEXTAUTH_SECRET);

  if (!secretMaterial) {
    throw new Error("SECRET_ENCRYPTION_KEY or NEXTAUTH_SECRET is required for backfill.");
  }

  return crypto.scryptSync(secretMaterial, ENCRYPTION_SALT, 32);
};

const encryptionKey = getEncryptionKey();

const isEncryptedSecret = (value) =>
  typeof value === "string" && value.startsWith(ENCRYPTION_PREFIX);

const encryptSecret = (value) => {
  if (!value || isEncryptedSecret(value)) {
    return value;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "enc",
    "v1",
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(":");
};

async function backfillUserSecrets() {
  const existingColumns = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
  `);
  const existingColumnSet = new Set(existingColumns.map((row) => row.column_name));
  const usableFields = USER_SECRET_FIELDS.filter((field) => existingColumnSet.has(field));

  if (usableFields.length === 0) {
    return 0;
  }

  const selectColumns = ["id", ...usableFields].map((field) => `"${field}"`).join(", ");
  const users = await prisma.$queryRawUnsafe(`SELECT ${selectColumns} FROM "User"`);
  let updatedCount = 0;

  for (const user of users) {
    const data = {};

    for (const field of usableFields) {
      const value = user[field];
      if (typeof value === "string" && value.trim() && !isEncryptedSecret(value)) {
        data[field] = encryptSecret(value.trim());
      }
    }

    if (Object.keys(data).length > 0) {
      const assignments = Object.entries(data).map(
        ([field, value]) => `"${field}" = '${value.replace(/'/g, "''")}'`
      );
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET ${assignments.join(", ")} WHERE "id" = '${String(user.id).replace(/'/g, "''")}'`
      );
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function backfillConnectionCredentials() {
  const connections = await prisma.externalConnection.findMany({
    select: {
      id: true,
      credentials: true,
    },
  });

  let updatedCount = 0;

  for (const connection of connections) {
    if (connection.credentials && !isEncryptedSecret(connection.credentials)) {
      await prisma.externalConnection.update({
        where: { id: connection.id },
        data: {
          credentials: encryptSecret(connection.credentials),
        },
      });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function main() {
  const [usersUpdated, connectionsUpdated] = await Promise.all([
    backfillUserSecrets(),
    backfillConnectionCredentials(),
  ]);

  console.log(
    JSON.stringify(
      {
        usersUpdated,
        connectionsUpdated,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Encrypted secret backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
