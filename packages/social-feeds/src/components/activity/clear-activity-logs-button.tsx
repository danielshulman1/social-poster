"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type ClearResponse = { cleared: number } | { error: string };

export function ClearActivityLogsButton() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [isClearing, startTransition] = React.useTransition();
    const [errorMessage, setErrorMessage] = React.useState<string>("");

    const clearLogs = () => {
        setErrorMessage("");

        startTransition(async () => {
            try {
                const response = await fetch("/api/activity/clear", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                });

                const payload = (await response.json().catch(() => ({}))) as Partial<ClearResponse>;
                if (!response.ok) {
                    const message =
                        typeof (payload as { error?: unknown })?.error === "string"
                            ? String((payload as { error: string }).error)
                            : "Failed to clear activity logs.";
                    setErrorMessage(message);
                    return;
                }

                setOpen(false);
                router.refresh();
            } catch (error) {
                setErrorMessage(
                    error instanceof Error ? error.message : "Failed to clear activity logs."
                );
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Trash2 />
                    Clear logs
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clear activity logs?</DialogTitle>
                    <DialogDescription>
                        This deletes your workflow run history (runs + node steps). It does not delete workflows or subscription
                        usage history.
                    </DialogDescription>
                </DialogHeader>
                {errorMessage ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                        {errorMessage}
                    </div>
                ) : null}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isClearing}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={clearLogs} disabled={isClearing}>
                        {isClearing ? "Clearing…" : "Clear logs"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

