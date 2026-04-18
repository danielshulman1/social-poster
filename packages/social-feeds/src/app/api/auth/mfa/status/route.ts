import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMandatoryMfaRequirement, parseBackupCodeHashes } from "@/lib/mfa";
import { decryptUserSecretFields } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = decryptUserSecretFields(await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      mfaEnabled: true,
      mfaPendingSecret: true,
      mfaBackupCodes: true,
      mfaPendingBackupCodes: true,
    },
  }));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const requirement = await getMandatoryMfaRequirement(userId, user.role);

  return NextResponse.json({
    mfaEnabled: Boolean(user.mfaEnabled),
    hasPendingSetup: Boolean(user.mfaPendingSecret),
    requiredByPolicy: requirement.required,
    policyReason: requirement.reason,
    enrollmentRequired: session.user?.mfaEnrollmentRequired === true,
    verificationRequired: session.user?.mfaRequired === true && session.user?.mfaVerified !== true,
    backupCodesRemaining: parseBackupCodeHashes(user.mfaBackupCodes).length,
    pendingBackupCodesRemaining: parseBackupCodeHashes(user.mfaPendingBackupCodes).length,
  });
}
