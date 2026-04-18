import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildOtpAuthUri,
  generateBackupCodes,
  generateMfaSecret,
  serializeBackupCodeHashes,
} from "@/lib/mfa";
import { encryptUserSecretUpdate } from "@/lib/user-secrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateMfaSecret();
  const backupCodes = generateBackupCodes();
  const otpAuthUri = buildOtpAuthUri({ email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
  });

  await prisma.user.update({
    where: { id: userId },
    data: encryptUserSecretUpdate({
      mfaPendingSecret: secret,
      mfaPendingBackupCodes: serializeBackupCodeHashes(backupCodes),
    }),
  });

  return NextResponse.json({
    secret,
    qrCodeDataUrl,
    backupCodes,
    otpAuthUri,
  });
}
