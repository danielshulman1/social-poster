import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:v1";
const ENCRYPTION_SALT = "social-feeds-secret-crypto";
const IV_LENGTH = 12;

const normalizeSecretMaterial = (value?: string | null) =>
  (value || "").trim().replace(/^["']|["']$/g, "");

const getEncryptionKey = () => {
  const secretMaterial =
    normalizeSecretMaterial(process.env.SECRET_ENCRYPTION_KEY) ||
    normalizeSecretMaterial(process.env.NEXTAUTH_SECRET);

  if (!secretMaterial) {
    return null;
  }

  return crypto.scryptSync(secretMaterial, ENCRYPTION_SALT, 32);
};

export const isEncryptedSecret = (value: string | null | undefined) =>
  typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);

export function encryptSecret(value: string): string {
  if (!value) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  if (isEncryptedSecret(value)) {
    return value;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return value ?? null;
  }

  if (!isEncryptedSecret(value)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return null;
  }

  const [, version, ivPart, encryptedPart, tagPart] = value.split(":");
  if (version !== "v1" || !ivPart || !encryptedPart || !tagPart) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivPart, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
