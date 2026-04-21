"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Bot,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
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
    adminBypass?: boolean;
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
    "Open Settings first and save the social app credentials you plan to use.",
    "Open Connections and start the provider OAuth flow from there.",
    "Approve access for the page or profile you want to publish from.",
    "Come back here and click Refresh status once the connected account appears.",
];

const aiInstructions = [
    "Open the OpenAI API keys page in a new tab.",
    "Create a new secret key and copy it immediately because OpenAI only shows the full value once.",
    "Paste the key into the field below and click Save OpenAI key.",
    "If you want Google or OpenRouter instead, open Settings and save that provider there.",
];

const personaInstructions = [
    "Open Persona setup.",
    "Write down your business type, target audience, offers, and the topics you want to post about.",
    "Answer the persona questions using the tone you want the AI to copy.",
    "Add sample posts or examples if you already have content that sounds like you.",
    "Generate the persona, review the wording, and save it.",
];

const workflowInstructions = [
    "Click Create my first workflow.",
    "The app will generate a starter workflow and open the editor.",
    "Add or confirm a source node, an AI step, and at least one publish destination node.",
    "Choose the connected social account on the destination node and select the persona you created earlier.",
    "Save the workflow so your setup is fully complete.",
];

const facebookOAuthInstructions = (facebookRedirectUri: string, appDomain: string) => [
    "Open Settings in this app and save your Facebook App ID and App Secret.",
    "In Meta for Developers, create or open your app, then add the Facebook Login product.",
    `Under App Settings > Basic, add ${appDomain || "your app domain"} as the App Domain if Meta asks for it.`,
    `Under Facebook Login > Settings, enable Client OAuth Login and Web OAuth Login, then add ${facebookRedirectUri || "your Facebook callback URL"} to Valid OAuth Redirect URIs.`,
    "Return to Connections and click Connect with Facebook.",
    "Log in to Facebook, approve the requested permissions, and make sure you select the pages you want this app to manage.",
    "After Meta redirects back, this app exchanges the OAuth code automatically and imports your pages for you.",
];

const linkedinOAuthInstructions = (linkedinRedirectUri: string) => [
    "Open LinkedIn Developers and create an app if you do not already have one.",
    "In the Products tab, request Share on LinkedIn and Sign In with LinkedIn using OpenID Connect.",
    "In the Auth tab, copy the Client ID and Client Secret.",
    "Open Settings in this app and save those LinkedIn credentials.",
    `Still in LinkedIn Auth settings, add ${linkedinRedirectUri || "your LinkedIn callback URL"} as an authorized redirect URL.`,
    "Return to Connections and click Connect LinkedIn.",
    "Sign in, approve access, and let LinkedIn redirect back so this app can exchange the OAuth code automatically.",
];

function InstructionList({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-2 text-sm text-muted-foreground">
            {steps.map((instruction, index) => (
                <li key={instruction} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                        {index + 1}
                    </span>
                    <span>{instruction}</span>
                </li>
            ))}
        </ol>
    );
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
    const res = await fetch("/api/onboarding/status", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load onboarding status");
    return res.json();
}

export default function OnboardingPage() {
    const router = useRouter();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState("");
    const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);
    const [openaiKey, setOpenaiKey] = useState("");

    const loadStatus = async () => {
        try {
            const data = await fetchOnboardingStatus();
            if (data?.adminBypass) {
                router.replace("/dashboard");
                return;
            }
            setStatus(data);
        } catch {
            toast.error("Failed to load onboarding progress");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadInitialStatus = async () => {
            try {
                const data = await fetchOnboardingStatus();
                if (data?.adminBypass) {
                    router.replace("/dashboard");
                    return;
                }
                if (isMounted) {
                    setStatus(data);
                }
            } catch {
                toast.error("Failed to load onboarding progress");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadInitialStatus();

        return () => {
            isMounted = false;
        };
    }, [router]);

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

    const handleCreateWorkflowFromPrompt = async () => {
        const trimmedPrompt = generatePrompt.trim();
        if (!trimmedPrompt) return;

        setIsGeneratingWorkflow(true);
        try {
            const generateRes = await fetch("/api/workflows/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: trimmedPrompt }),
            });

            const generated = await generateRes.json().catch(() => null);
            if (!generateRes.ok || !generated) {
                throw new Error(generated?.error || "Failed to generate workflow");
            }

            const createRes = await fetch("/api/workflows", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: generated.name || "My First Workflow",
                    definition: generated.definition,
                }),
            });

            const workflow = await createRes.json().catch(() => null);
            if (!createRes.ok || !workflow) {
                throw new Error(workflow?.error || "Failed to create workflow");
            }

            if (typeof window !== "undefined") {
                window.sessionStorage.setItem(
                    `workflow-draft:${workflow.id}`,
                    JSON.stringify({
                        name: generated.name || "My First Workflow",
                        definition: generated.definition,
                    })
                );
            }

            toast.success("Your first workflow is ready");
            if (Array.isArray(generated.warnings) && generated.warnings.length > 0) {
                toast.message("Review generated setup", {
                    description: generated.warnings.slice(0, 2).join(" "),
                    duration: 10000,
                });
            }

            setIsGenerateDialogOpen(false);
            setGeneratePrompt("");
            await loadStatus();
            router.push(`/editor/${workflow.id}`);
        } catch {
            toast.error("Could not create your first workflow");
        } finally {
            setIsGeneratingWorkflow(false);
        }
    };

    if (isLoading || !status) {
        return (
            <div className="app-page-shell flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const allDone = status.completed;
    const activeStep = allDone ? 0 : status.currentStep;
    const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const appDomain = appOrigin ? new URL(appOrigin).hostname : "";
    const facebookRedirectUri = appOrigin ? `${appOrigin}/api/auth/facebook/callback` : "";
    const linkedinRedirectUri = appOrigin ? `${appOrigin}/api/auth/linkedin/callback` : "";
    const canCreateWorkflow =
        status.steps.social.complete &&
        status.steps.ai.complete &&
        status.steps.persona.complete &&
        !status.steps.workflow.complete;

    return (
        <div className="app-page-shell bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-10">
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
                                <InstructionList steps={socialInstructions} />
                            </div>
                            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4">
                                <p className="mb-2 text-sm font-medium text-foreground">About the OAuth code</p>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    You do not paste a Facebook or LinkedIn OAuth code into this app manually. When you click the
                                    connection button in <span className="font-medium text-foreground">Connections</span>, the provider sends
                                    the code back to this app&apos;s callback URL and the server exchanges it for tokens automatically.
                                </p>
                            </div>
                            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground">Facebook setup</p>
                                        <a
                                            href="https://developers.facebook.com/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-primary underline"
                                        >
                                            Open Meta Developers
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <InstructionList steps={facebookOAuthInstructions(facebookRedirectUri, appDomain)} />
                                </div>
                                <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                                    <p>
                                        Facebook callback URL: <span className="font-mono text-foreground">{facebookRedirectUri || "Loading..."}</span>
                                    </p>
                                    <p className="mt-1">
                                        If Meta says <span className="font-medium text-foreground">URL blocked</span>, the callback above is
                                        missing or does not exactly match the value saved in your Meta app.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-foreground">LinkedIn setup</p>
                                        <a
                                            href="https://www.linkedin.com/developers/apps"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-primary underline"
                                        >
                                            Open LinkedIn Developers
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                    <InstructionList steps={linkedinOAuthInstructions(linkedinRedirectUri)} />
                                </div>
                                <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                                    <p>
                                        LinkedIn callback URL: <span className="font-mono text-foreground">{linkedinRedirectUri || "Loading..."}</span>
                                    </p>
                                    <p className="mt-1">
                                        LinkedIn needs both the correct redirect URL and the required app products before the Connect
                                        LinkedIn button will work reliably.
                                    </p>
                                </div>
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
                                <InstructionList steps={aiInstructions} />
                            </div>
                            <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                                <p>
                                    OpenAI keys are created at{" "}
                                    <a
                                        href="https://platform.openai.com/api-keys"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline"
                                    >
                                        platform.openai.com/api-keys
                                    </a>
                                    . Create the key there, then paste it here.
                                </p>
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
                                <InstructionList steps={personaInstructions} />
                            </div>
                            <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                                <p>
                                    Good persona inputs are: who you help, the problems you solve, your tone of voice, topics you post
                                    about, phrases you like to use, and examples of posts that already sound right.
                                </p>
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
                                Start from a blank workflow or describe the flow in text and let the app build the first pass for you.
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
                                <InstructionList steps={workflowInstructions} />
                            </div>
                            <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                                <p>
                                    Minimum working workflow: one source node, one AI step, and one destination node that uses a connected
                                    social account. Save once those are wired together.
                                </p>
                            </div>
                            {status.steps.workflow.complete ? (
                                <Link href="/">
                                    <Button className="w-full" variant="outline">
                                        Open workflows
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" variant="outline" disabled={!canCreateWorkflow || isCreatingWorkflow || isGeneratingWorkflow}>
                                                {isGeneratingWorkflow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                Describe and create
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Generate Your First Workflow</DialogTitle>
                                                <DialogDescription>
                                                    Describe what you want the workflow to do. The app will create it and open it in the editor.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Textarea
                                                value={generatePrompt}
                                                onChange={(event) => setGeneratePrompt(event.target.value)}
                                                placeholder="Example: Every Monday at 9am read my Google Sheet, write a LinkedIn post, use the image from the same row, and hold it for approval."
                                                className="min-h-[160px]"
                                            />
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsGenerateDialogOpen(false);
                                                        setGeneratePrompt("");
                                                    }}
                                                    disabled={isGeneratingWorkflow}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateWorkflowFromPrompt} disabled={!generatePrompt.trim() || isGeneratingWorkflow}>
                                                    {isGeneratingWorkflow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                    Generate
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Button className="w-full" onClick={handleCreateWorkflow} disabled={!canCreateWorkflow || isCreatingWorkflow || isGeneratingWorkflow}>
                                        {isCreatingWorkflow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create my first workflow
                                    </Button>
                                </div>
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
