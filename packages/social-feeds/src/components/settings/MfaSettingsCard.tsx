"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Copy, Loader2, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MfaStatus = {
  mfaEnabled: boolean;
  hasPendingSetup: boolean;
  requiredByPolicy: boolean;
  enrollmentRequired: boolean;
  verificationRequired: boolean;
  backupCodesRemaining: number;
};

type SetupPayload = {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  otpAuthUri: string;
};

const copyText = async (value: string, message: string) => {
  await navigator.clipboard.writeText(value);
  toast.success(message);
};

export function MfaSettingsCard() {
  const { update } = useSession();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setupPayload, setSetupPayload] = useState<SetupPayload | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingSetup, setIsStartingSetup] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/status", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load MFA status");
      }
      setStatus(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load MFA status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleStartSetup = async () => {
    setIsStartingSetup(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start MFA setup");
      }
      setSetupPayload(data);
      setSetupCode("");
      await loadStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start MFA setup");
    } finally {
      setIsStartingSetup(false);
    }
  };

  const handleEnable = async () => {
    if (!setupCode.trim()) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setIsEnabling(true);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to enable MFA");
      }

      setSetupPayload(null);
      setSetupCode("");
      await update({
        mfaEnabled: true,
        mfaVerified: true,
        mfaEnrollmentRequired: false,
      });
      await loadStatus();
      toast.success("Two-factor authentication is now enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable MFA");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode.trim()) {
      toast.error("Enter your authenticator code or a backup code.");
      return;
    }

    setIsDisabling(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to disable MFA");
      }

      setDisableCode("");
      await update({
        mfaEnabled: false,
        mfaVerified: false,
        mfaEnrollmentRequired: false,
      });
      await loadStatus();
      toast.success("Two-factor authentication has been disabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable MFA");
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Protect admin and publishing access with an authenticator app and one-time backup codes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading MFA status...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status?.mfaEnabled ? "default" : "secondary"}>
                {status?.mfaEnabled ? "Enabled" : "Disabled"}
              </Badge>
              {status?.requiredByPolicy && (
                <Badge variant="outline">Required for this account</Badge>
              )}
              {status?.enrollmentRequired && (
                <Badge variant="destructive">Setup required before continuing</Badge>
              )}
            </div>

            {status?.requiredByPolicy && (
              <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    MFA is mandatory for admin users and accounts with publishing access. Keep at least one authenticator app enrolled.
                  </div>
                </div>
              </div>
            )}

            {!status?.mfaEnabled && !setupPayload && (
              <Button onClick={handleStartSetup} disabled={isStartingSetup}>
                {isStartingSetup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Up MFA
              </Button>
            )}

            {setupPayload && (
              <div className="grid gap-4 rounded-3xl border border-border/70 bg-muted/20 p-4 lg:grid-cols-[220px_1fr]">
                <div className="space-y-3">
                  <img
                    src={setupPayload.qrCodeDataUrl}
                    alt="MFA QR code"
                    className="h-[220px] w-[220px] rounded-2xl border border-border/60 bg-white p-3"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyText(setupPayload.otpAuthUri, "Authenticator link copied.")}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy App Link
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Manual setup secret</Label>
                    <div className="flex gap-2">
                      <Input value={setupPayload.secret} readOnly className="font-mono" />
                      <Button
                        variant="outline"
                        onClick={() => copyText(setupPayload.secret, "Secret copied.")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mfa-setup-code">Authenticator code</Label>
                    <Input
                      id="mfa-setup-code"
                      placeholder="123456"
                      value={setupCode}
                      onChange={(event) => setSetupCode(event.target.value)}
                    />
                    <Button onClick={handleEnable} disabled={isEnabling}>
                      {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify And Enable
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Backup codes</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {setupPayload.backupCodes.map((code) => (
                        <div
                          key={code}
                          className="rounded-2xl border border-border/70 bg-background px-3 py-2 font-mono text-sm"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyText(setupPayload.backupCodes.join("\n"), "Backup codes copied.")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Backup Codes
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Save these now. Each backup code works once and they are only shown during setup.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status?.mfaEnabled && (
              <div className="space-y-4 rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Authenticator app active
                </div>
                <p className="text-sm text-muted-foreground">
                  Backup codes remaining: {status.backupCodesRemaining}
                </p>
                {!status.requiredByPolicy && (
                  <div className="space-y-2">
                    <Label htmlFor="disable-mfa-code">Disable MFA with a current code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="disable-mfa-code"
                        placeholder="123456 or backup code"
                        value={disableCode}
                        onChange={(event) => setDisableCode(event.target.value)}
                      />
                      <Button variant="destructive" onClick={handleDisable} disabled={isDisabling}>
                        {isDisabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
