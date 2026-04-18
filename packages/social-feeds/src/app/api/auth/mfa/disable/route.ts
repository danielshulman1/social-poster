import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeBackupCode, getMandatoryMfaRequirement, verifyTotpCode } from "@/lib/mfa";
import { decryptUserSecretFields, encryptUserSecretUpdate } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.trim() : "";

  const user = decryptUserSecretFields(await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  }));

  if (!user?.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: "MFA is not enabled on this account." }, { status: 400 });
  }

  const requirement = await getMandatoryMfaRequirement(userId, user.role);
  if (requirement.required) {
    return NextResponse.json(
      { error: "MFA cannot be disabled while this account has admin or publishing access." },
      { status: 400 }
    );
  }

  const totpValid = verifyTotpCode(user.mfaSecret, code);
  const backupCodeResult = totpValid
    ? { matched: false, nextValue: user.mfaBackupCodes ?? "[]", remaining: 0 }
    : consumeBackupCode(user.mfaBackupCodes, code);

  if (!totpValid && !backupCodeResult.matched) {
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: encryptUserSecretUpdate({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      mfaPendingSecret: null,
      mfaPendingBackupCodes: null,
    }),
  });

  return NextResponse.json({ success: true });
}
