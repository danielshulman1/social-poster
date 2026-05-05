import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseConnectionCredentials } from "@/lib/connection-credentials";
import { normalizeEnv } from "@/lib/appUrl";
import { decryptUserSecretFields } from "@/lib/user-secrets";

type SignedRequestPayload = {
  algorithm?: string;
  user_id?: string;
  issued_at?: number;
  expires?: number;
  [key: string]: unknown;
};

const STATUS_TOKEN_VERSION = "v1";

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
};

const base64UrlEncode = (value: Buffer | string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const timingSafeEqual = (left: Buffer, right: Buffer) => {
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const getStatusSigningSecret = () =>
  normalizeEnv(process.env.NEXTAUTH_SECRET)
  || normalizeEnv(process.env.SECRET_KEY)
  || "social-feeds-data-deletion";

const signStatusPayload = (payload: string) =>
  base64UrlEncode(
    crypto.createHmac("sha256", getStatusSigningSecret()).update(payload).digest()
  );

export const createDeletionStatusToken = (confirmationCode: string, metaUserId: string) => {
  const payload = JSON.stringify({
    v: STATUS_TOKEN_VERSION,
    code: confirmationCode,
    user_id: metaUserId,
  });
  return `${base64UrlEncode(payload)}.${signStatusPayload(payload)}`;
};

export const verifyDeletionStatusToken = (token: string | null, confirmationCode: string | null) => {
  if (!token || !confirmationCode) return null;

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const payload = base64UrlDecode(encodedPayload).toString("utf8");
  const expectedSignature = signStatusPayload(payload);
  if (!timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(encodedSignature))) {
    return null;
  }

  const parsed = JSON.parse(payload) as { v?: string; code?: string; user_id?: string };
  if (parsed.v !== STATUS_TOKEN_VERSION || parsed.code !== confirmationCode || !parsed.user_id) {
    return null;
  }

  return parsed;
};

const listCandidateSecrets = async () => {
  const candidates = new Set<string>();

  [
    process.env.FACEBOOK_APP_SECRET,
    process.env.FACEBOOK_PAGE_SECRET,
    process.env.THREADS_CLIENT_SECRET,
  ]
    .map(normalizeEnv)
    .filter(Boolean)
    .forEach((secret) => candidates.add(secret));

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { facebookAppSecret: { not: null } },
        { threadsClientSecret: { not: null } },
      ],
    },
    select: {
      facebookAppSecret: true,
      threadsClientSecret: true,
    },
  });

  for (const user of users) {
    const decrypted = decryptUserSecretFields(user);
    const facebookSecret = normalizeEnv(decrypted?.facebookAppSecret as string | null | undefined);
    const threadsSecret = normalizeEnv(decrypted?.threadsClientSecret as string | null | undefined);
    if (facebookSecret) candidates.add(facebookSecret);
    if (threadsSecret) candidates.add(threadsSecret);
  }

  return Array.from(candidates);
};

export const verifySignedRequest = async (signedRequest: string) => {
  const [encodedSignature, encodedPayload] = signedRequest.split(".", 2);
  if (!encodedSignature || !encodedPayload) {
    throw new Error("Malformed signed_request");
  }

  const payloadJson = base64UrlDecode(encodedPayload).toString("utf8");
  const payload = JSON.parse(payloadJson) as SignedRequestPayload;
  if (payload.algorithm !== "HMAC-SHA256") {
    throw new Error("Unsupported signed_request algorithm");
  }

  const actualSignature = base64UrlDecode(encodedSignature);
  const candidateSecrets = await listCandidateSecrets();
  for (const secret of candidateSecrets) {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(encodedPayload)
      .digest();

    if (timingSafeEqual(actualSignature, expectedSignature)) {
      return payload;
    }
  }

  throw new Error("Signed request signature could not be verified");
};

export const purgeMetaUserData = async (metaUserId: string) => {
  const deletedConnectionIds = new Set<string>();
  const deletedAppAccountIds = new Set<string>();
  const affectedLocalUserIds = new Set<string>();

  const matchingAccounts = await prisma.account.findMany({
    where: {
      providerAccountId: metaUserId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  for (const account of matchingAccounts) {
    deletedAppAccountIds.add(account.id);
    affectedLocalUserIds.add(account.userId);
  }

  if (deletedAppAccountIds.size > 0) {
    await prisma.account.deleteMany({
      where: {
        id: {
          in: Array.from(deletedAppAccountIds),
        },
      },
    });
  }

  const candidateConnections = await prisma.externalConnection.findMany({
    where: {
      provider: {
        in: ["facebook", "instagram", "threads"],
      },
    },
    select: {
      id: true,
      userId: true,
      credentials: true,
    },
  });

  for (const connection of candidateConnections) {
    const creds = parseConnectionCredentials(connection.credentials);
    const valuesToMatch = [
      creds.userId,
      creds.user_id,
      creds.platformUserId,
      creds.username,
      creds.pageId,
      creds.instagramBusinessAccountId,
    ].filter((value): value is string => typeof value === "string");

    if (valuesToMatch.includes(metaUserId) || affectedLocalUserIds.has(connection.userId)) {
      deletedConnectionIds.add(connection.id);
      affectedLocalUserIds.add(connection.userId);
    }
  }

  if (deletedConnectionIds.size > 0) {
    await prisma.externalConnection.deleteMany({
      where: {
        id: {
          in: Array.from(deletedConnectionIds),
        },
      },
    });
  }

  return {
    metaUserId,
    deletedAccountCount: deletedAppAccountIds.size,
    deletedConnectionCount: deletedConnectionIds.size,
    affectedLocalUserCount: affectedLocalUserIds.size,
  };
};
