'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Loader2, Eye, EyeOff, Key, CheckCircle2, Radio, Bot, ArrowUpRight, UserRound } from 'lucide-react';
import { MfaSettingsCard } from '@/components/settings/MfaSettingsCard';
import { SubscriptionSettings } from '@/components/subscription-settings';
import { useWorkflowStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SettingsPage() {
    const personas = useWorkflowStore((state) => state.personas);
    const defaultPersonaId = useWorkflowStore((state) => state.defaultPersonaId);
    const setDefaultPersonaId = useWorkflowStore((state) => state.setDefaultPersonaId);
    const addPersona = useWorkflowStore((state) => state.addPersona);
    const removePersona = useWorkflowStore((state) => state.removePersona);

    const [newName, setNewName] = useState('');
    const [newPrompt, setNewPrompt] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [hasExistingKey, setHasExistingKey] = useState(false);
    const [keyPreview, setKeyPreview] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [linkedinClientId, setLinkedinClientId] = useState('');
    const [linkedinClientSecret, setLinkedinClientSecret] = useState('');
    const [hasLinkedinCredentials, setHasLinkedinCredentials] = useState(false);
    const [linkedinClientIdPreview, setLinkedinClientIdPreview] = useState('');
    const [showLinkedinSecret, setShowLinkedinSecret] = useState(false);
    const [isSavingLinkedin, setIsSavingLinkedin] = useState(false);
    const [threadsClientId, setThreadsClientId] = useState('');
    const [threadsClientSecret, setThreadsClientSecret] = useState('');
    const [hasThreadsCredentials, setHasThreadsCredentials] = useState(false);
    const [threadsClientIdPreview, setThreadsClientIdPreview] = useState('');
    const [showThreadsSecret, setShowThreadsSecret] = useState(false);
    const [isSavingThreads, setIsSavingThreads] = useState(false);
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [googleApiKeyPreview, setGoogleApiKeyPreview] = useState('');
    const [showGoogleKey, setShowGoogleKey] = useState(false);
    const [isSavingGoogleKey, setIsSavingGoogleKey] = useState(false);

    // OpenRouter specific state
    const [openrouterApiKey, setOpenrouterApiKey] = useState('');
    const [hasOpenrouterApiKey, setHasOpenrouterApiKey] = useState(false);
    const [openrouterApiKeyPreview, setOpenrouterApiKeyPreview] = useState('');
    const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
    const [isSavingOpenrouterKey, setIsSavingOpenrouterKey] = useState(false);

    // Gemini (image generation) specific state
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);
    const [geminiApiKeyPreview, setGeminiApiKeyPreview] = useState('');
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [isSavingGeminiKey, setIsSavingGeminiKey] = useState(false);

    // Facebook specific state
    const [hasGoogleApiKey, setHasGoogleApiKey] = useState(false);
    const [facebookAppId, setFacebookAppId] = useState('');
    const [facebookAppSecret, setFacebookAppSecret] = useState('');
    const [hasFacebookAppCredentials, setHasFacebookAppCredentials] = useState(false);
    const [facebookAppIdPreview, setFacebookAppIdPreview] = useState('');
    const [showFacebookAppSecret, setShowFacebookAppSecret] = useState(false);
    const [isSavingFacebookApp, setIsSavingFacebookApp] = useState(false);
    const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const facebookRedirectUri = appOrigin ? `${appOrigin}/api/auth/facebook/callback` : '';
    const threadsRedirectUri = appOrigin ? `${appOrigin}/api/auth/threads/callback` : '';

    useEffect(() => {
        fetch('/api/user/settings')
            .then(res => res.json())
            .then(data => {
                if (data.name) setDisplayName(data.name);
                if (data.email) setEmail(data.email);
                if (data.hasOpenaiKey) {
                    setHasExistingKey(true);
                    setKeyPreview(data.openaiKeyPreview || '');
                }
                if (data.hasLinkedinCredentials) {
                    setHasLinkedinCredentials(true);
                    setLinkedinClientIdPreview(data.linkedinClientId || '');
                }
                if (data.hasThreadsCredentials) {
                    setHasThreadsCredentials(true);
                    setThreadsClientIdPreview(data.threadsClientId || '');
                }
                if (data.hasGoogleApiKey) {
                    setHasGoogleApiKey(true);
                    setGoogleApiKeyPreview(data.googleApiKeyPreview || '');
                }
                if (data.hasOpenrouterKey) {
                    setHasOpenrouterApiKey(true);
                    setOpenrouterApiKeyPreview(data.openrouterKeyPreview || '');
                }
                if (data.hasGeminiApiKey) {
                    setHasGeminiApiKey(true);
                    setGeminiApiKeyPreview(data.geminiApiKeyPreview || '');
                }
                if (data.hasFacebookAppCredentials) {
                    setHasFacebookAppCredentials(true);
                    setFacebookAppIdPreview(data.facebookAppId || '');
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: displayName }),
            });
            if (!res.ok) throw new Error();
            toast.success('Profile saved!');
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveApiKey = async () => {
        if (!openaiKey.trim()) {
            toast.error('Please enter an API key');
            return;
        }
        setIsSavingKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiApiKey: openaiKey.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasExistingKey(true);
            setKeyPreview(`sk-...${openaiKey.trim().slice(-4)}`);
            setOpenaiKey('');
            toast.success('API key saved! You can now test AI nodes.');
        } catch {
            toast.error('Failed to save API key');
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleRemoveApiKey = async () => {
        setIsSavingKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openaiApiKey: null }),
            });
            if (!res.ok) throw new Error();
            setHasExistingKey(false);
            setKeyPreview('');
            setOpenaiKey('');
            toast.success('API key removed');
        } catch {
            toast.error('Failed to remove API key');
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleSaveGoogleKey = async () => {
        if (!googleApiKey.trim()) {
            toast.error('Please enter a Google API key');
            return;
        }
        setIsSavingGoogleKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleApiKey: googleApiKey.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasGoogleApiKey(true);
            setGoogleApiKeyPreview(`...${googleApiKey.trim().slice(-4)}`);
            setGoogleApiKey('');
            toast.success('Google API key saved! You can now fetch sheet tabs.');
        } catch {
            toast.error('Failed to save Google API key');
        } finally {
            setIsSavingGoogleKey(false);
        }
    };

    const handleRemoveGoogleKey = async () => {
        setIsSavingGoogleKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleApiKey: null }),
            });
            if (!res.ok) throw new Error();
            setHasGoogleApiKey(false);
            setGoogleApiKeyPreview('');
            setGoogleApiKey('');
            toast.success('Google API key removed');
        } catch {
            toast.error('Failed to remove Google API key');
        } finally {
            setIsSavingGoogleKey(false);
        }
    };

    const handleSaveLinkedin = async () => {
        const clientId = linkedinClientId.trim();
        const clientSecret = linkedinClientSecret.trim();
        // When no credentials exist yet, both fields are required. When updating
        // existing credentials, allow saving just the field(s) that changed —
        // the Client ID field is empty on return (it shows a masked preview), so
        // requiring it again would block a secret-only update.
        if (!hasLinkedinCredentials && (!clientId || !clientSecret)) {
            toast.error('Please enter both Client ID and Client Secret');
            return;
        }
        if (!clientId && !clientSecret) {
            toast.error('Enter a new Client ID or Client Secret to update.');
            return;
        }
        setIsSavingLinkedin(true);
        try {
            const payload: Record<string, string> = {};
            if (clientId) payload.linkedinClientId = clientId;
            if (clientSecret) payload.linkedinClientSecret = clientSecret;
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error();
            setHasLinkedinCredentials(true);
            if (clientId) setLinkedinClientIdPreview(clientId);
            setLinkedinClientId('');
            setLinkedinClientSecret('');
            toast.success('LinkedIn credentials saved! Go to Connections to connect your account.');
        } catch {
            toast.error('Failed to save LinkedIn credentials');
        } finally {
            setIsSavingLinkedin(false);
        }
    };

    const handleRemoveLinkedin = async () => {
        setIsSavingLinkedin(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinClientId: null, linkedinClientSecret: null }),
            });
            if (!res.ok) throw new Error();
            setHasLinkedinCredentials(false);
            setLinkedinClientIdPreview('');
            toast.success('LinkedIn credentials removed');
        } catch {
            toast.error('Failed to remove LinkedIn credentials');
        } finally {
            setIsSavingLinkedin(false);
        }
    };

    const handleSaveFacebookApp = async () => {
        if (!facebookAppId.trim() || !facebookAppSecret.trim()) {
            toast.error('Please enter both App ID and App Secret');
            return;
        }
        setIsSavingFacebookApp(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facebookAppId: facebookAppId.trim(), facebookAppSecret: facebookAppSecret.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasFacebookAppCredentials(true);
            setFacebookAppIdPreview(facebookAppId.trim());
            setFacebookAppId('');
            setFacebookAppSecret('');
            toast.success('Facebook credentials saved! Go to Connections to connect your account.');
        } catch {
            toast.error('Failed to save Facebook credentials');
        } finally {
            setIsSavingFacebookApp(false);
        }
    };

    const handleRemoveFacebookApp = async () => {
        setIsSavingFacebookApp(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facebookAppId: null, facebookAppSecret: null }),
            });
            if (!res.ok) throw new Error();
            setHasFacebookAppCredentials(false);
            setFacebookAppIdPreview('');
            toast.success('Facebook credentials removed');
        } catch {
            toast.error('Failed to remove Facebook credentials');
        } finally {
            setIsSavingFacebookApp(false);
        }
    };

    const handleSaveOpenrouterKey = async () => {
        if (!openrouterApiKey.trim()) {
            toast.error('Please enter an OpenRouter API key');
            return;
        }
        setIsSavingOpenrouterKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openrouterApiKey: openrouterApiKey.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasOpenrouterApiKey(true);
            setOpenrouterApiKeyPreview(`sk-or-v1-...${openrouterApiKey.trim().slice(-4)}`);
            setOpenrouterApiKey('');
            toast.success('OpenRouter API key saved! You can now select OpenRouter as a provider on AI nodes.');
        } catch {
            toast.error('Failed to save OpenRouter API key');
        } finally {
            setIsSavingOpenrouterKey(false);
        }
    };

    const handleRemoveOpenrouterKey = async () => {
        setIsSavingOpenrouterKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openrouterApiKey: null }),
            });
            if (!res.ok) throw new Error();
            setHasOpenrouterApiKey(false);
            setOpenrouterApiKeyPreview('');
            setOpenrouterApiKey('');
            toast.success('OpenRouter API key removed');
        } catch {
            toast.error('Failed to remove OpenRouter API key');
        } finally {
            setIsSavingOpenrouterKey(false);
        }
    };

    const handleSaveGeminiKey = async () => {
        if (!geminiApiKey.trim()) {
            toast.error('Please enter a Gemini API key');
            return;
        }
        setIsSavingGeminiKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geminiApiKey: geminiApiKey.trim() }),
            });
            if (!res.ok) throw new Error();
            setHasGeminiApiKey(true);
            setGeminiApiKeyPreview(`...${geminiApiKey.trim().slice(-4)}`);
            setGeminiApiKey('');
            toast.success('Gemini API key saved! You can now select Gemini on Image Generation nodes.');
        } catch {
            toast.error('Failed to save Gemini API key');
        } finally {
            setIsSavingGeminiKey(false);
        }
    };

    const handleRemoveGeminiKey = async () => {
        setIsSavingGeminiKey(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geminiApiKey: null }),
            });
            if (!res.ok) throw new Error();
            setHasGeminiApiKey(false);
            setGeminiApiKeyPreview('');
            setGeminiApiKey('');
            toast.success('Gemini API key removed');
        } catch {
            toast.error('Failed to remove Gemini API key');
        } finally {
            setIsSavingGeminiKey(false);
        }
    };

    const handleAddPersona = () => {
        if (newName && newPrompt) {
            addPersona({ id: Date.now().toString(), name: newName, prompt: newPrompt });
            setNewName('');
            setNewPrompt('');
            toast.success('Persona added!');
        }
    };

    const handleSaveThreads = async () => {
        if (!threadsClientId.trim() || !threadsClientSecret.trim()) {
            toast.error('Please enter both Client ID and Client Secret');
            return;
        }
        setIsSavingThreads(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadsClientId: threadsClientId.trim(),
                    threadsClientSecret: threadsClientSecret.trim(),
                }),
            });
            if (!res.ok) throw new Error();
            setHasThreadsCredentials(true);
            setThreadsClientIdPreview(threadsClientId.trim());
            setThreadsClientId('');
            setThreadsClientSecret('');
            toast.success('Threads credentials saved! Go to Connections to connect your account.');
        } catch {
            toast.error('Failed to save Threads credentials');
        } finally {
            setIsSavingThreads(false);
        }
    };

    const handleRemoveThreads = async () => {
        setIsSavingThreads(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadsClientId: null, threadsClientSecret: null }),
            });
            if (!res.ok) throw new Error();
            setHasThreadsCredentials(false);
            setThreadsClientIdPreview('');
            toast.success('Threads credentials removed');
        } catch {
            toast.error('Failed to remove Threads credentials');
        } finally {
            setIsSavingThreads(false);
        }
    };

    const aiReadyCount = Number(hasExistingKey) + Number(hasGoogleApiKey) + Number(hasOpenrouterApiKey);
    const socialReadyCount =
        Number(hasLinkedinCredentials) +
        Number(hasThreadsCredentials) +
        Number(hasFacebookAppCredentials);
    const settingsHealthLabel = socialReadyCount > 0 && aiReadyCount > 0 ? 'Operational' : 'Needs setup';

    if (isLoading) {
        return <div className="flex h-full items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="grid gap-8 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
                    <div className="space-y-4">
                        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">Settings Control Room</Badge>
                        <div className="space-y-3">
                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground">Configure credentials, routing, and AI defaults without guessing what comes next.</h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                This page now mirrors the real integration flow: save the right app credentials, confirm the exact callback values, and move straight into Connections with less trial-and-error.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Meta redirect: <span className="font-medium text-foreground">{facebookRedirectUri || 'Loading...'}</span></div>
                            <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">Readiness: <span className="font-medium text-foreground">{settingsHealthLabel}</span></div>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-3xl border border-blue-200/60 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(96,165,250,0.04))] p-4">
                            <div className="flex items-center justify-between">
                                <UserRound className="h-5 w-5 text-primary" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Profile</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{displayName || 'Unnamed'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
                        </div>
                        <div className="rounded-3xl border border-blue-200/60 bg-[linear-gradient(135deg,rgba(37,99,235,0.1),rgba(255,255,255,0.02))] p-4">
                            <div className="flex items-center justify-between">
                                <Bot className="h-5 w-5 text-primary" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">AI Keys</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{aiReadyCount}/3</p>
                            <p className="mt-1 text-sm text-muted-foreground">Providers configured</p>
                        </div>
                        <div className="rounded-3xl border border-rose-200/60 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.02))] p-4">
                            <div className="flex items-center justify-between">
                                <Radio className="h-5 w-5 text-rose-500" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Social Apps</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{socialReadyCount}/3</p>
                            <p className="mt-1 text-sm text-muted-foreground">OAuth apps ready</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-border/70 bg-card/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Account ready
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Profile, API keys, and OAuth apps are separated below so each save action has a clear outcome.</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Radio className="h-4 w-4 text-primary" />
                        Social routing
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Facebook and LinkedIn cards include their exact callback URLs so you can mirror them in the provider dashboards.</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card/80 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ArrowUpRight className="h-4 w-4 text-rose-500" />
                        Next step
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Once an app is saved here, move to Connections and authorize the account with a fresh OAuth run.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* PROFILE */}
                <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/30">
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={email} disabled />
                        </div>
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                <MfaSettingsCard />

                <SubscriptionSettings />

                {/* API KEYS */}
                <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            API Keys
                        </CardTitle>
                        <CardDescription>Manage your AI provider API keys. Your key is stored securely and only used for your workflow executions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>OpenAI API Key</Label>
                            {hasExistingKey && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{keyPreview}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveApiKey} disabled={isSavingKey}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showKey ? 'text' : 'password'}
                                        placeholder={hasExistingKey ? 'Enter new key to replace...' : 'sk-...'}
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowKey(!showKey)}
                                    >
                                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button onClick={handleSaveApiKey} disabled={isSavingKey || !openaiKey.trim()}>
                                    {isSavingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-foreground">platform.openai.com/api-keys</a>
                            </p>
                        </div>

                        <Separator />

                        {/* Google API Key */}
                        <div className="grid gap-2">
                            <Label>Google API Key</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Required for Google Sheets integration (fetching tabs &amp; reading/writing data).
                            </p>
                            {hasGoogleApiKey && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{googleApiKeyPreview}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveGoogleKey} disabled={isSavingGoogleKey}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showGoogleKey ? 'text' : 'password'}
                                        placeholder={hasGoogleApiKey ? 'Enter new key to replace...' : 'AIza...'}
                                        value={googleApiKey}
                                        onChange={(e) => setGoogleApiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowGoogleKey(!showGoogleKey)}
                                    >
                                        {showGoogleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button onClick={handleSaveGoogleKey} disabled={isSavingGoogleKey || !googleApiKey.trim()} size="sm">
                                    {isSavingGoogleKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Get your API key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline hover:text-foreground">Google Cloud Console</a>. Enable the <strong>Google Sheets API</strong>.
                            </p>
                        </div>

                        <Separator />

                        {/* OpenRouter API Key */}
                        <div className="grid gap-2">
                            <Label>OpenRouter API Key</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Used for accessing various AI models (like Claude, LLaMA, etc.) via OpenRouter.
                            </p>
                            {hasOpenrouterApiKey && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{openrouterApiKeyPreview}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveOpenrouterKey} disabled={isSavingOpenrouterKey}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showOpenrouterKey ? 'text' : 'password'}
                                        placeholder={hasOpenrouterApiKey ? 'Enter new key to replace...' : 'sk-or-v1-...'}
                                        value={openrouterApiKey}
                                        onChange={(e) => setOpenrouterApiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                                    >
                                        {showOpenrouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button onClick={handleSaveOpenrouterKey} disabled={isSavingOpenrouterKey || !openrouterApiKey.trim()} size="sm">
                                    {isSavingOpenrouterKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline hover:text-foreground">openrouter.ai/keys</a>.
                            </p>
                        </div>

                        <Separator />

                        {/* Gemini API Key */}
                        <div className="grid gap-2">
                            <Label>Gemini API Key</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Used by Image Generation nodes to create images with Gemini (Nano Banana). Separate from the Google API Key above, which is only for Sheets.
                            </p>
                            {hasGeminiApiKey && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Active</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{geminiApiKeyPreview}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveGeminiKey} disabled={isSavingGeminiKey}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showGeminiKey ? 'text' : 'password'}
                                        placeholder={hasGeminiApiKey ? 'Enter new key to replace...' : 'AIza...'}
                                        value={geminiApiKey}
                                        onChange={(e) => setGeminiApiKey(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                    >
                                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button onClick={handleSaveGeminiKey} disabled={isSavingGeminiKey || !geminiApiKey.trim()} size="sm">
                                    {isSavingGeminiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Key
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline hover:text-foreground">aistudio.google.com/apikey</a>.
                            </p>
                        </div>

                        <Separator />

                        {/* LinkedIn Credentials */}
                        <div className="grid gap-2">
                            <Label>LinkedIn Developer App</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Required to post to LinkedIn. Create an app at{' '}
                                <a href="https://www.linkedin.com/developers/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">linkedin.com/developers</a>
                                {' '}and enable &quot;Share on LinkedIn&quot; + &quot;Sign In with LinkedIn using OpenID Connect&quot;.
                            </p>
                            {hasLinkedinCredentials && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{linkedinClientIdPreview || 'Configured'}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveLinkedin} disabled={isSavingLinkedin}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Client ID"
                                    value={linkedinClientId}
                                    onChange={(e) => setLinkedinClientId(e.target.value)}
                                />
                                <div className="relative">
                                    <Input
                                        type={showLinkedinSecret ? 'text' : 'password'}
                                        placeholder="Client Secret"
                                        value={linkedinClientSecret}
                                        onChange={(e) => setLinkedinClientSecret(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowLinkedinSecret(!showLinkedinSecret)}
                                    >
                                        {showLinkedinSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button
                                    onClick={handleSaveLinkedin}
                                    disabled={isSavingLinkedin || !linkedinClientId.trim() || !linkedinClientSecret.trim()}
                                    size="sm"
                                >
                                    {isSavingLinkedin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save LinkedIn Credentials
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Add redirect URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/linkedin/callback</code>
                            </p>
                        </div>

                        <Separator />

                        {/* Facebook App Credentials */}
                        <div className="grid gap-2">
                            <Label>Threads Developer App</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Required to connect and publish to Threads. Use the Threads App ID and Threads App Secret from the Threads product in Meta, not the Basic App ID from App Settings.
                            </p>
                            {hasThreadsCredentials && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{threadsClientIdPreview || 'Configured'}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveThreads} disabled={isSavingThreads}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Threads App ID"
                                    value={threadsClientId}
                                    onChange={(e) => setThreadsClientId(e.target.value)}
                                />
                                <div className="relative">
                                    <Input
                                        type={showThreadsSecret ? 'text' : 'password'}
                                        placeholder="Threads App Secret"
                                        value={threadsClientSecret}
                                        onChange={(e) => setThreadsClientSecret(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowThreadsSecret(!showThreadsSecret)}
                                    >
                                        {showThreadsSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button
                                    onClick={handleSaveThreads}
                                    disabled={isSavingThreads || !threadsClientId.trim() || !threadsClientSecret.trim()}
                                    size="sm"
                                >
                                    {isSavingThreads && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Threads Credentials
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Add redirect URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">{threadsRedirectUri}</code>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Meta Basic App ID and Threads App ID can be different. The value saved here must match the app where this redirect URI is whitelisted.
                            </p>
                        </div>

                        <Separator />

                        {/* Facebook App Credentials */}
                        <div className="grid gap-2">
                            <Label>Facebook Developer App</Label>
                            <p className="text-[11px] text-muted-foreground mb-1">
                                Required to connect to Facebook and Instagram. Create an app at{' '}
                                <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">developers.facebook.com</a>
                                {' '}and add the Facebook Login product. These credentials override the shared Facebook app for your account.
                            </p>
                            {hasFacebookAppCredentials && (
                                <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                                    <span className="text-sm font-mono text-muted-foreground">{facebookAppIdPreview || 'Configured'}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 h-7" onClick={handleRemoveFacebookApp} disabled={isSavingFacebookApp}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="App ID"
                                    value={facebookAppId}
                                    onChange={(e) => setFacebookAppId(e.target.value)}
                                />
                                <div className="relative">
                                    <Input
                                        type={showFacebookAppSecret ? 'text' : 'password'}
                                        placeholder="App Secret"
                                        value={facebookAppSecret}
                                        onChange={(e) => setFacebookAppSecret(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowFacebookAppSecret(!showFacebookAppSecret)}
                                    >
                                        {showFacebookAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button
                                    onClick={handleSaveFacebookApp}
                                    disabled={isSavingFacebookApp || !facebookAppId.trim() || !facebookAppSecret.trim()}
                                    size="sm"
                                >
                                    {isSavingFacebookApp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Facebook Credentials
                                </Button>
                            </div>
                            <div className="rounded-md border bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-2">
                                <p className="font-medium text-foreground">Meta app setup</p>
                                <p>
                                    App Domains: <code className="text-xs bg-muted px-1 py-0.5 rounded">{appOrigin ? new URL(appOrigin).hostname : ''}</code>
                                </p>
                                <p>
                                    Valid OAuth Redirect URI: <code className="text-xs bg-muted px-1 py-0.5 rounded">{facebookRedirectUri}</code>
                                </p>
                                <p>Facebook Login &gt; Settings: turn on Client OAuth Login and Web OAuth Login.</p>
                                <p>If Meta shows &quot;URL Blocked&quot;, the redirect URI above is not whitelisted in the Facebook app tied to these credentials.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PERSONAS */}
                <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/30">
                        <CardTitle>AI Personas</CardTitle>
                        <CardDescription>Manage master prompts for your AI workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {personas.length === 0 && (
                                <p className="text-sm text-muted-foreground">No personas created yet. Add one below.</p>
                            )}
                            {personas.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-2 border rounded bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-4 h-4 rounded-full border cursor-pointer flex items-center justify-center ${defaultPersonaId === p.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                            onClick={() => setDefaultPersonaId(p.id)}
                                            title="Set as Default"
                                        >
                                            {defaultPersonaId === p.id && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {p.name}
                                                {defaultPersonaId === p.id && <Badge variant="secondary" className="text-[10px] h-5">Default</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">{p.prompt}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removePersona(p.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>New Persona Name</Label>
                            <Input placeholder="e.g. Friendly Helper" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Master Prompt</Label>
                            <textarea
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="You are a helper..."
                                value={newPrompt}
                                onChange={(e) => setNewPrompt(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddPersona}>Add Persona</Button>
                    </CardContent>
                </Card>

                {/* NOTIFICATIONS */}
                <Card className="overflow-hidden border-border/70 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-muted/30">
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Configure how you receive alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notif" className="flex flex-col space-y-1">
                                <span>Email Notifications</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive emails about workflow failures.</span>
                            </Label>
                            <Switch id="email-notif" defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="slack-notif" className="flex flex-col space-y-1">
                                <span>Slack Notifications</span>
                                <span className="font-normal text-xs text-muted-foreground">Receive alerts in a dedicated Slack channel.</span>
                            </Label>
                            <Switch id="slack-notif" />
                        </div>
                    </CardContent>
                </Card>

                {/* DANGER ZONE */}
                <Card className="overflow-hidden border-red-200 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-red-100 bg-red-50/60 dark:bg-red-950/20">
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive">Delete Account</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
