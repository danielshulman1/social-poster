import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";

export const USER_SECRET_FIELDS = [
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
] as const;

type UserSecretField = (typeof USER_SECRET_FIELDS)[number];
type SecretRecord = Partial<Record<UserSecretField, string | null>>;

export function decryptUserSecretFields<T extends Record<string, unknown> | null>(
  user: T
): T {
  if (!user) {
    return user;
  }

  const nextUser = { ...user } as T & SecretRecord;

  for (const field of USER_SECRET_FIELDS) {
    if (typeof nextUser[field] === "string") {
      nextUser[field] = decryptSecret(nextUser[field]) ?? null;
    }
  }

  return nextUser;
}

export function encryptUserSecretUpdate<T extends Record<string, unknown>>(data: T): T {
  const nextData = { ...data } as T & SecretRecord;

  for (const field of USER_SECRET_FIELDS) {
    if (typeof nextData[field] === "string") {
      const trimmed = nextData[field]?.trim();
      nextData[field] = trimmed ? encryptSecret(trimmed) : null;
    }
  }

  return nextData;
}

export const getSecretPreview = (value: string | null | undefined, prefix = "...") =>
  value ? `${prefix}${value.slice(-4)}` : null;
