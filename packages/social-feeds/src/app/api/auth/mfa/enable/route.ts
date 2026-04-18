import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotpCode } from "@/lib/mfa";
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
  const code = typeof body.code === "string" ? body.code : "";

  const user = decryptUserSecretFields(await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaPendingSecret: true,
      mfaPendingBackupCodes: true,
    },
  }));

  if (!user?.mfaPendingSecret || !user.mfaPendingBackupCodes) {
    return NextResponse.json({ error: "No MFA setup is pending." }, { status: 400 });
  }

  if (!verifyTotpCode(user.mfaPendingSecret, code)) {
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: encryptUserSecretUpdate({
      mfaEnabled: true,
      mfaSecret: user.mfaPendingSecret,
      mfaBackupCodes: user.mfaPendingBackupCodes,
      mfaPendingSecret: null,
      mfaPendingBackupCodes: null,
    }),
  });

  return NextResponse.json({
    success: true,
  });
}
