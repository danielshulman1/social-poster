-- Add MFA support to the user table
ALTER TABLE "User"
ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mfaSecret" TEXT,
ADD COLUMN "mfaPendingSecret" TEXT,
ADD COLUMN "mfaBackupCodes" TEXT,
ADD COLUMN "mfaPendingBackupCodes" TEXT;
