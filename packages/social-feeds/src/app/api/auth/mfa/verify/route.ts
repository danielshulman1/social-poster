import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeBackupCode, verifyTotpCode } from "@/lib/mfa";
import { decryptUserSecretFields } from "@/lib/user-secrets";

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
      mfaEnabled: true,
      mfaSecret: true,
      mfaBackupCodes: true,
    },
  }));

  if (!user?.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: "MFA is not enabled on this account." }, { status: 400 });
  }

  if (verifyTotpCode(user.mfaSecret, code)) {
    return NextResponse.json({ success: true, usedBackupCode: false });
  }

  const backupCodeResult = consumeBackupCode(user.mfaBackupCodes, code);
  if (!backupCodeResult.matched) {
    return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: backupCodeResult.nextValue,
    },
  });

  return NextResponse.json({
    success: true,
    usedBackupCode: true,
    backupCodesRemaining: backupCodeResult.remaining,
  });
}
