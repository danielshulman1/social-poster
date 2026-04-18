import crypto from "crypto";

type OAuthStateBasePayload = {
  userId: string;
  provider: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type OAuthStatePayload = OAuthStateBasePayload & {
  codeVerifier?: string;
};

const normalizeEnv = (value?: string | null) =>
  (value || "").trim().replace(/^["']|["']$/g, "");

const getOAuthStateSecret = () =>
  normalizeEnv(process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET);

const toBase64Url = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
};

const signPayload = (payload: string) => {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error("OAuth state secret is not configured");
  }

  return crypto.createHmac("sha256", secret).update(payload).digest();
};

export function createOAuthState(input: {
  userId: string;
  provider: string;
  codeVerifier?: string;
  ttlMs?: number;
}) {
  const payload: OAuthStatePayload = {
    userId: input.userId,
    provider: input.provider,
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + (input.ttlMs ?? 10 * 60 * 1000),
    ...(input.codeVerifier ? { codeVerifier: input.codeVerifier } : {}),
  };

  const serializedPayload = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serializedPayload);
  const signature = toBase64Url(signPayload(encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export function verifyOAuthState(state: string, expectedProvider: string): OAuthStatePayload | null {
  const [encodedPayload, encodedSignature] = state.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const actualSignature = fromBase64Url(encodedSignature);
  if (expectedSignature.length !== actualSignature.length) return null;
  if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as OAuthStatePayload;
    if (!payload?.userId || !payload?.provider || !payload?.expiresAt) return null;
    if (payload.provider !== expectedProvider) return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
