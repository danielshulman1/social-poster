import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";

export type ConnectionCredentials = Record<string, any>;

export function parseConnectionCredentials(raw: string | null | undefined): ConnectionCredentials {
  const decoded = decryptSecret(raw) ?? raw ?? "";

  if (!decoded) {
    return {};
  }

  try {
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ConnectionCredentials)
      : {};
  } catch {
    return {};
  }
}

export function serializeConnectionCredentials(credentials: ConnectionCredentials): string {
  return encryptSecret(JSON.stringify(credentials));
}
