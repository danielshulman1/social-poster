-- AddColumn
ALTER TABLE "UserPersona" ADD COLUMN "auditUsed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserPersona" ADD COLUMN "auditAuthorizedAt" TIMESTAMP(3);
