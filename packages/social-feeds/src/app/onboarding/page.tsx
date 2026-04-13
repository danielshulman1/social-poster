"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Bot,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Radio,
    RefreshCw,
    Sparkles,
    Wand2,
    Workflow,
} from "lucide-react";
import { toast } from "sonner";

type OnboardingStatus = {
    completed: boolean;
    completedAt: string | null;
    needsOnboarding: boolean;
    currentStep: number;
    steps: {
        social: {
            complete: boolean;
            count: number;
            connections: Array<{ id: string; provider: string; name: string }>;
        };
        ai: {
            complete: boolean;
            provider: string | null;
        };
        persona: {
            complete: boolean;
            updatedAt: string | null;
        };
        workflow: {
            complete: boolean;
            count: number;
        };
    };
};

const stepCardClass = (active: boolean, complete: boolean) => {
    if (complete) return "border-emerald-200 bg-emerald-50/70";
    if (active) return "border-blue-300 bg-blue-50/80";
    return "border-border/70 bg-card/90";
};

const socialInstructions = [
    "Open Connections.",
    "Choose the platform you want to connect first, such as Facebook or LinkedIn.",
    "Complete the OAuth or token flow for that platform.",
    "Come back here and click Refresh status once the account appears as connected.",
];

const aiInstructions = [
    "Get your OpenAI API key from platform.openai.com/api-keys.",
    "Paste the key into the field below.",
    "Click Save OpenAI key.",
    "If you want to use a different provider instead, open Settings and save that provider there.",
];

const personaInstructions = [
    "Open Persona setup.",
    "Answer the interview questions about your brand, audience, and tone.",
    "Add sample posts if you have them.",
    "Generate the persona and save it.",
];

const workflowInstructions = [
    "Click Create my first workflow.",
    "The app will generate a starter workflow for you.",
    "Review the editor and connect the nodes you need.",
    "Save the workflow so your setup is fully complete.",
];

export default function OnboardingPage() {
    const router = useRouter();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
    const [openaiKey, setOpenaiKey] = useState("");

    const loadStatus = async () => {
        try {
            const res = await fetch("/api/onboarding/status", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to load onboarding status");
            const data = await res.json();
            setStatus(data);
        } catch {
            toast.error("Failed to load onboarding progress");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const handleSaveOpenAiKey = async () => {
        if (!openaiKey.trim()) {
            toast.error("Enter an OpenAI API key first");
            return;
        }

        setIsSavingKey(true);
        try {
            const res = await fetch("/api/user/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openaiApiKey: openaiKey.trim() }),
            });

            if (!res.ok) throw new Error("Failed to save API key");

            setOpenaiKey("");
            toast.success("API key saved");
            await loadStatus();
        } catch {
            toast.error("Could not save the API key");
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleCreateWorkflow = async () => {
        setIsCreatingWorkflow(true);
        try {
            const res = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "My First Workflow" }),
            });

            if (!res.ok) throw new Error("Failed to create workflow");

            const workflow = await res.json();
            toast.success("Your first workflow is ready");
            await loadStatus();
            router.push(`/editor/${workflow.id}`);
        } catch {
            toast.error("Could not create your first workflow");
        } finally {
            setIsCreatingWorkflow(false);
        }
    };

    if (isLoading || !status) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const allDone = status.completed;
    const activeStep = allDone ? 0 : status.currentStep;
    const canCreateWorkflow =
        status.steps.social.complete &&
        status.steps.ai.complete &&
        status.steps.persona.complete &&
        !status.steps.workflow.complete;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-10">
            <div className="mx-auto max-w-5xl space-y-8">
                <section className="rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                                One-Time Onboarding
                            </Badge>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                                    Set up the full publishing stack once.
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Connect a social account, add an AI key, build your persona, and create your first workflow.
                                    We&apos;ll remember completion and stop showing this flow after it&apos;s done.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={loadStatus}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh status
                            </Button>
                            {allDone && (
                                <Link href="/dashboard">
                                    <Button>
                                        Open dashboard
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className={stepCardClass(activeStep === 1, status.steps.social.complete)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Radio className="h-5 w-5" />
                                    1. Connect a Social Account
                                </CardTitle>
                                {status.steps.social.complete && (
                                    <Badge className="bg-emerald-600">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Complete
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                Add at least one live connection so your workflows can publish somewhere real.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {status.steps.social.complete
                                    ? `${status.steps.social.count} connection${status.steps.social.count === 1 ? "" : "s"} detected.`
                                    : "No social accounts connected yet."}
                            </p>
                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                <p className="mb-3 text-sm font-medium text-foreground">How to do this</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    {socialInstructions.map((instruction, index) => (
                                        <li key={instruction} className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                                {index + 1}
                                            </span>
                                            <span>{instruction}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            {status.steps.social.connections.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {status.steps.social.connections.map((connection) => (
                                        <Badge key={connection.id} variant="secondary" className="capitalize">
                                            {connection.provider}: {connection.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <Link href="/connections">
                                <Button className="w-full" variant={status.steps.social.complete ? "outline" : "default"}>
                                    {status.steps.social.complete ? "Review connections" : "Open connections"}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className={stepCardClass(activeStep === 2, status.steps.ai.complete)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    2. Add an AI API Key
                                </CardTitle>
                                {status.steps.ai.complete && (
                                    <Badge className="bg-emerald-600">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Complete
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                Save the AI provider key your workflows will use for writing and generation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {status.steps.ai.complete
                                    ? `Configured provider: ${status.steps.ai.provider}.`
                                    : "Add an OpenAI key here, or use Settings if you prefer another provider."}
                            </p>
                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                <p className="mb-3 text-sm font-medium text-foreground">How to do this</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    {aiInstructions.map((instruction, index) => (
                                        <li key={instruction} className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                                {index + 1}
                                            </span>
                                            <span>{instruction}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            {!status.steps.ai.complete && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="onboarding-openai-key">OpenAI API key</Label>
                                        <Input
                                            id="onboarding-openai-key"
                                            type="password"
                                            placeholder="sk-..."
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleSaveOpenAiKey}
                                        disabled={isSavingKey || !openaiKey.trim()}
                                    >
                                        {isSavingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save OpenAI key
                                    </Button>
                                </div>
                            )}
                            {status.steps.ai.complete && (
                                <Link href="/settings">
                                    <Button className="w-full" variant="outline">
                                        Review settings
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={stepCardClass(activeStep === 3, status.steps.persona.complete)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Wand2 className="h-5 w-5" />
                                    3. Build Your Persona
                                </CardTitle>
                                {status.steps.persona.complete && (
                                    <Badge className="bg-emerald-600">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Complete
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                Capture your voice, positioning, and content pillars so AI outputs sound like you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {status.steps.persona.complete
                                    ? `Persona saved${status.steps.persona.updatedAt ? ` on ${new Date(status.steps.persona.updatedAt).toLocaleDateString()}` : ""}.`
                                    : "Walk through the persona interview to create your brand voice profile."}
                            </p>
                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                <p className="mb-3 text-sm font-medium text-foreground">How to do this</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    {personaInstructions.map((instruction, index) => (
                                        <li key={instruction} className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                                {index + 1}
                                            </span>
                                            <span>{instruction}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <Link href="/persona">
                                <Button className="w-full" variant={status.steps.persona.complete ? "outline" : "default"}>
                                    {status.steps.persona.complete ? "Review persona" : "Open persona setup"}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className={stepCardClass(activeStep === 4, status.steps.workflow.complete)}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Workflow className="h-5 w-5" />
                                    4. Create Your First Workflow
                                </CardTitle>
                                {status.steps.workflow.complete && (
                                    <Badge className="bg-emerald-600">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Complete
                                    </Badge>
                                )}
                            </div>
                            <CardDescription>
                                Start with a blank workflow so the editor, publishing nodes, and connected accounts are ready to use.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {status.steps.workflow.complete
                                    ? `${status.steps.workflow.count} workflow${status.steps.workflow.count === 1 ? "" : "s"} created.`
                                    : "Create your first workflow after the setup steps above are complete."}
                            </p>
                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                <p className="mb-3 text-sm font-medium text-foreground">How to do this</p>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    {workflowInstructions.map((instruction, index) => (
                                        <li key={instruction} className="flex gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                                {index + 1}
                                            </span>
                                            <span>{instruction}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            {status.steps.workflow.complete ? (
                                <Link href="/">
                                    <Button className="w-full" variant="outline">
                                        Open workflows
                                    </Button>
                                </Link>
                            ) : (
                                <Button className="w-full" onClick={handleCreateWorkflow} disabled={!canCreateWorkflow || isCreatingWorkflow}>
                                    {isCreatingWorkflow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create my first workflow
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 bg-card/90">
                    <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Progress
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {allDone
                                    ? "Onboarding is complete. Future sign-ins will go straight into the app."
                                    : `You are on step ${activeStep} of 4. Finish each setup task once and this onboarding flow will stop appearing.`}
                            </p>
                        </div>
                        {!allDone && (
                            <div className="flex gap-2">
                                <Link href="/settings">
                                    <Button variant="outline">Open settings</Button>
                                </Link>
                                <Link href="/dashboard">
                                    <Button variant="ghost">Skip to dashboard</Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
