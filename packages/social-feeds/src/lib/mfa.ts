import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const MFA_ISSUER = "Social Poster";

const PUBLISHING_PROVIDERS = [
  "facebook",
  "linkedin",
  "instagram",
  "threads",
  "twitter",
  "tiktok",
  "youtube",
  "pinterest",
  "wordpress",
  "wix",
  "squarespace",
] as const;

const PUBLISHER_NODE_TYPES = [
  "facebook-publisher",
  "linkedin-publisher",
  "instagram-publisher",
  "threads-publisher",
  "wordpress-publisher",
  "wix-publisher",
  "squarespace-publisher",
  "google-sheets-publisher",
] as const;

const normalizeDigits = (value: string) => value.replace(/\D/g, "");

const leftPad = (value: string, length: number) => value.padStart(length, "0");

export function encodeBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(value: string) {
  const normalized = value.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let current = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    current = (current << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateMfaSecret() {
  return encodeBase32(crypto.randomBytes(20));
}

export function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () =>
    `${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`.toUpperCase()
  );
}

export function hashBackupCode(code: string) {
  return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function serializeBackupCodeHashes(codes: string[]) {
  return JSON.stringify(codes.map(hashBackupCode));
}

export function parseBackupCodeHashes(value: string | null | undefined) {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function consumeBackupCode(value: string | null | undefined, code: string) {
  const hashes = parseBackupCodeHashes(value);
  const candidateHash = hashBackupCode(code);
  const index = hashes.indexOf(candidateHash);

  if (index === -1) {
    return {
      matched: false,
      nextValue: value ?? JSON.stringify(hashes),
      remaining: hashes.length,
    };
  }

  hashes.splice(index, 1);

  return {
    matched: true,
    nextValue: JSON.stringify(hashes),
    remaining: hashes.length,
  };
}

function generateHotp(secret: string, counter: number) {
  const key = decodeBase32(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);

  const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return leftPad(String(binary % 10 ** TOTP_DIGITS), TOTP_DIGITS);
}

export function verifyTotpCode(secret: string, code: string, window = 1) {
  const normalizedCode = normalizeDigits(code);
  if (normalizedCode.length !== TOTP_DIGITS) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -window; offset <= window; offset += 1) {
    if (generateHotp(secret, currentCounter + offset) === normalizedCode) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(params: { email: string; secret: string }) {
  const label = encodeURIComponent(`${MFA_ISSUER}:${params.email}`);
  const issuer = encodeURIComponent(MFA_ISSUER);
  return `otpauth://totp/${label}?secret=${params.secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}

export async function getMandatoryMfaRequirement(userId: string, role?: string | null) {
  if (role === "admin") {
    return {
      required: true,
      reason: "admin",
    };
  }

  const [connectionCount, workflowCount] = await Promise.all([
    prisma.externalConnection.count({
      where: {
        userId,
        provider: { in: [...PUBLISHING_PROVIDERS] },
      },
    }),
    prisma.workflow.count({
      where: {
        userId,
        OR: PUBLISHER_NODE_TYPES.map((nodeType) => ({
          definition: { contains: nodeType },
        })),
      },
    }),
  ]);

  if (connectionCount > 0 || workflowCount > 0) {
    return {
      required: true,
      reason: connectionCount > 0 ? "publishing_connections" : "publishing_workflows",
    };
  }

  return {
    required: false,
    reason: null,
  };
}

export function isMfaBootstrapApiPath(pathname: string | null) {
  if (!pathname) return false;

  return pathname.startsWith("/api/auth/mfa") || pathname === "/api/user/settings";
}
