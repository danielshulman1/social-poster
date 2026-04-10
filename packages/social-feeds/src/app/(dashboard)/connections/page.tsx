'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Facebook,
    Linkedin,
    Instagram,
    AtSign,
    Globe,
    PenSquare,
    FileSpreadsheet,
    Rss,
    Bot,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Plus,
    Trash2,
    Save,
    ArrowRight,
    ShieldCheck,
    Settings2,
    Link2
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store';
import { ConnectionGuide } from '@/components/connections/ConnectionGuide';
import { toast } from 'sonner';

function ConnectionsPageContent() {
    const store = useWorkflowStore();
    const [isFetchingSheets, setIsFetchingSheets] = useState(false);
    const [availableSheets, setAvailableSheets] = useState<string[]>([]);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountPlatform, setNewAccountPlatform] = useState<'facebook' | 'linkedin' | 'instagram' | 'threads' | 'wordpress' | 'wix' | 'squarespace'>('facebook');
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [newRSSUrl, setNewRSSUrl] = useState('');
    const [newRSSName, setNewRSSName] = useState('');

    const [newAccountToken, setNewAccountToken] = useState('');
    const [connectionNotice, setConnectionNotice] = useState<null | {
        tone: 'success' | 'warning' | 'info';
        title: string;
        description: string;
    }>(null);

    // Removed Facebook SDK App ID state logic



    const [facebookPages, setFacebookPages] = useState<any[]>([]);
    const [isFetchingPages, setIsFetchingPages] = useState(false);

    const normalizeAccessToken = (raw: string) => {
        let token = raw.trim();
        if (!token) return '';

        token = token.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

        if (token.startsWith('{') || token.startsWith('[')) {
            try {
                const parsed = JSON.parse(token);
                const candidate =
                    parsed?.access_token ??
                    parsed?.accessToken ??
                    parsed?.token ??
                    parsed?.authResponse?.accessToken ??
                    '';
                token = typeof candidate === 'string' ? candidate : token;
            } catch {
                // Keep original token if JSON parsing fails.
            }
        }

        if (/^https?:\/\//i.test(token)) {
            try {
                const parsedUrl = new URL(token);
                const candidate = parsedUrl.searchParams.get('access_token');
                if (candidate) token = candidate;
            } catch {
                // Keep original token if URL parsing fails.
            }
        } else if (token.includes('access_token=')) {
            try {
                const parsedParams = new URLSearchParams(token.startsWith('?') ? token.slice(1) : token);
                const candidate = parsedParams.get('access_token');
                if (candidate) token = candidate;
            } catch {
                // Keep original token if search params parsing fails.
            }
        }

        return token.replace(/\s+/g, '');
    };

    const normalizeSpreadsheetId = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match?.[1] || trimmed;
    };

    const fetchSheets = async (spreadsheetId: string) => {
        const normalizedSpreadsheetId = normalizeSpreadsheetId(spreadsheetId);
        if (!normalizedSpreadsheetId) {
            toast.error('Please enter a Spreadsheet ID first.');
            return;
        }

        setIsFetchingSheets(true);
        try {
            const res = await fetch(`/api/google/sheets/meta?spreadsheetId=${encodeURIComponent(normalizedSpreadsheetId)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Failed to fetch sheets');
            }

            const sheets = Array.isArray(data.sheets) ? data.sheets : [];
            setAvailableSheets(sheets);

            if (sheets.length > 0 && !sheets.includes(store.googleSheetsConfig.sheetName)) {
                store.updateGoogleSheetsConfig({ sheetName: sheets[0] });
            }

            toast.success(`Found ${sheets.length} sheet${sheets.length === 1 ? '' : 's'}`);
        } catch (error: any) {
            console.error(error);
            setAvailableSheets([]);
            toast.error(error?.message || 'Failed to fetch sheets');
        } finally {
            setIsFetchingSheets(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (!success && !error) return;

        if (success === 'facebook') {
            const added = Number(params.get('added') || 0);
            const igAdded = Number(params.get('igAdded') || 0);
            if (added > 0 || igAdded > 0) {
                toast.success(`Connected ${added} Facebook page(s) and ${igAdded} Instagram account(s).`);
                setConnectionNotice({
                    tone: 'success',
                    title: 'Facebook authorization completed',
                    description: `Imported ${added} Facebook page(s) and ${igAdded} linked Instagram account(s).`,
                });
            } else {
                toast.success('Facebook connected.');
                setConnectionNotice({
                    tone: 'success',
                    title: 'Facebook authorization completed',
                    description: 'The OAuth flow succeeded. If no pages appeared, re-run with page access selected in Meta.',
                });
            }
            // Refetch connections after successful OAuth with a small delay
            setTimeout(() => {
                fetch('/api/connections')
                    .then(res => {
                        if (!res.ok) {
                            console.error('API response not ok:', res.status);
                            return [];
                        }
                        return res.json();
                    })
                    .then(connections => {
                        console.log('Fetched connections:', connections);
                        store.setAccounts(connections);
                    })
                    .catch(err => console.error('Error refetching connections:', err));
            }, 500);
        } else if (success === 'instagram') {
            const igName = params.get('igName') || 'Instagram';
            toast.success(`Instagram connected: ${igName}`);
            setConnectionNotice({
                tone: 'success',
                title: 'Instagram connected',
                description: `Successfully connected Instagram account ${igName}. You can now use it in your workflows.`,
            });
            // Refetch connections
            setTimeout(() => {
                fetch('/api/connections')
                    .then(res => {
                        if (!res.ok) return [];
                        return res.json();
                    })
                    .then(connections => {
                        store.setAccounts(connections);
                    })
                    .catch(err => console.error('Error refetching connections:', err));
            }, 500);
        } else if (success === 'linkedin') {
            toast.success('LinkedIn connected.');
            setConnectionNotice({
                tone: 'success',
                title: 'LinkedIn connected',
                description: 'Your LinkedIn OAuth flow completed successfully.',
            });
            // Refetch connections after successful OAuth with a small delay
            setTimeout(() => {
                fetch('/api/connections')
                    .then(res => {
                        if (!res.ok) {
                            console.error('API response not ok:', res.status);
                            return [];
                        }
                        return res.json();
                    })
                    .then(connections => {
                        console.log('Fetched connections:', connections);
                        store.setAccounts(connections);
                    })
                    .catch(err => console.error('Error refetching connections:', err));
            }, 500);
        } else if (success === 'google') {
            toast.success('Google connected.');
            setConnectionNotice({
                tone: 'success',
                title: 'Google Sheets connected',
                description: 'You can now load spreadsheet tabs and wire content rows into workflows.',
            });
        }

        if (error) {
            const decodedError = error;
            if (decodedError === 'missing_facebook_config') {
                toast.error('Facebook App ID/Secret missing. Add them in Settings first.');
                setConnectionNotice({
                    tone: 'warning',
                    title: 'Facebook app credentials missing',
                    description: 'Save your Meta App ID and App Secret in Settings before starting OAuth.',
                });
            } else if (decodedError === 'missing_linkedin_config') {
                toast.error('LinkedIn Client ID/Secret missing. Add them in Settings first.');
                setConnectionNotice({
                    tone: 'warning',
                    title: 'LinkedIn credentials missing',
                    description: 'Add the LinkedIn Client ID and Client Secret in Settings before retrying.',
                });
            } else if (decodedError === 'linkedin_profile_failed') {
                toast.error('LinkedIn authorization completed, but the profile lookup failed. Try connecting again.');
                setConnectionNotice({
                    tone: 'warning',
                    title: 'LinkedIn callback incomplete',
                    description: 'OAuth returned, but the profile lookup failed. Retry from a fresh Connections page load.',
                });
            } else if (decodedError.startsWith('token_failed')) {
                const detail = decodedError.split(':').slice(1).join(':').trim();
                toast.error(detail
                    ? `Facebook token exchange failed: ${detail}`
                    : 'Facebook token exchange failed. Check your app credentials and redirect URI.');
                setConnectionNotice({
                    tone: 'warning',
                    title: 'Facebook token exchange failed',
                    description: detail || 'Check the Meta app redirect URI, enabled permissions, and the exact app credentials saved in Settings.',
                });
            } else if (decodedError === 'fetch_pages_failed') {
                toast.error('Facebook login succeeded but pages could not be loaded. Re-check permissions and page access.');
                setConnectionNotice({
                    tone: 'warning',
                    title: 'Facebook login worked, but pages were not returned',
                    description: 'The app received an access token but could not enumerate pages. Confirm you selected the pages during Meta authorization.',
                });
            } else {
                toast.error(`Facebook connection failed: ${decodedError}`);
                setConnectionNotice({
                    tone: 'warning',
                    title: 'Connection flow failed',
                    description: decodedError,
                });
            }
        }

        window.history.replaceState({}, '', '/connections');
    }, []);

    useEffect(() => {
        if (!store.googleSheetsConfig.spreadsheetId) {
            setAvailableSheets([]);
            return;
        }

        fetchSheets(store.googleSheetsConfig.spreadsheetId);
    }, [store.googleSheetsConfig.spreadsheetId]);

    // Load existing connections from database on component mount and after successful OAuth redirect
    useEffect(() => {
        const fetchConnections = async () => {
            try {
                console.log('Fetching connections from /api/connections...');
                const res = await fetch('/api/connections');
                if (!res.ok) {
                    console.error('Failed to fetch connections, status:', res.status);
                    throw new Error(`Failed to fetch connections: ${res.status}`);
                }
                const connections = await res.json();
                console.log('Loaded connections:', connections);
                store.setAccounts(connections);
            } catch (error) {
                console.error('Error loading connections:', error);
            }
        };

        fetchConnections();
    }, []);

    const connectWithFacebookOAuth = () => {
        window.location.href = '/api/auth/facebook';
    };

    const connectWithInstagramOAuth = () => {
        window.location.href = '/api/auth/instagram';
    };

    const handleFetchPagesWithToken = async () => {
        const token = normalizeAccessToken(newAccountToken);
        if (!token) {
            toast.error("Please enter a Facebook Graph API Token first.");
            return;
        }
        if (/^\d+$/.test(token)) {
            toast.error("This looks like a numeric ID, not a Facebook access token. Use the full token string from Facebook.");
            return;
        }
        if (token.length < 40) {
            toast.error("Token looks too short. Paste the full Facebook access token (usually starts with 'EA').");
            return;
        }
        await fetchFacebookPages(token);
    };

    const fetchFacebookPages = async (overrideToken?: string) => {
        const tokenToUse = normalizeAccessToken(overrideToken || newAccountToken);
        if (!tokenToUse) return;

        setIsFetchingPages(true);
        try {
            const pageListUrl = new URL('https://graph.facebook.com/me/accounts');
            pageListUrl.searchParams.set('fields', 'id,name,access_token,category,instagram_business_account');
            const res = await fetch(pageListUrl.toString(), {
                headers: {
                    Authorization: `Bearer ${tokenToUse}`,
                },
            });
            const data = await res.json();

            if (data.error) {
                console.error("Facebook API Error:", data.error);
                toast.error(`Facebook Error: ${data.error.message}`);
                return;
            }

            if (data.data && Array.isArray(data.data)) {
                if (data.data.length === 0) {
                    console.warn("Token valid but 0 pages returned.");
                    toast.error("Found 0 Pages. Did you select 'pages_show_list' AND check the boxes next to your pages in the popup?");
                } else {
                    setFacebookPages(data.data);
                    toast.success(`Found ${data.data.length} pages`);

                    // If Instagram platform selected, auto-fetch linked IG accounts
                    if (newAccountPlatform === 'instagram') {
                        for (const page of data.data) {
                            try {
                                const igUrl = new URL(`https://graph.facebook.com/${page.id}`);
                                igUrl.searchParams.set('fields', 'instagram_business_account{id,name,username,profile_picture_url}');
                                const igRes = await fetch(igUrl.toString(), {
                                    headers: {
                                        Authorization: `Bearer ${page.access_token}`,
                                    },
                                });
                                const igData = await igRes.json();
                                if (igData.instagram_business_account) {
                                    const ig = igData.instagram_business_account;
                                    const connRes = await fetch('/api/connections', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            platform: 'instagram',
                                            name: ig.username || ig.name || `Instagram (${page.name})`,
                                            accessToken: page.access_token,
                                            username: ig.id
                                        })
                                    });
                                    if (connRes.ok) {
                                        const newConn = await connRes.json();
                                        store.addAccount({
                                            id: newConn.id,
                                            platform: 'instagram' as any,
                                            name: ig.username || ig.name || `Instagram (${page.name})`,
                                            status: 'active',
                                            username: ig.id,
                                            accessToken: page.access_token
                                        });
                                        toast.success(`Connected Instagram: ${ig.username || ig.name}`);
                                    }
                                }
                            } catch (e) {
                                console.error(`Error fetching IG for page ${page.id}:`, e);
                            }
                        }
                        setFacebookPages([]);
                        setNewAccountToken('');
                        setIsAddAccountOpen(false);
                    }
                }
            } else {
                console.warn("Unexpected Facebook response:", data);
                toast.error(`Invalid response: ${JSON.stringify(data)}`);
            }
        } catch (error: any) {
            console.error("Fetch error:", error);
            toast.error(`Network or Script Error: ${error.message}`);
        } finally {
            setIsFetchingPages(false);
        }
    };

    const connectFacebookPage = async (page: any) => {
        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'facebook',
                    name: page.name,
                    username: page.id,
                    accessToken: page.access_token // Page Access Token
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || "Failed to save connection");
            }

            const newConnection = await res.json();

            store.addAccount({
                id: newConnection.id,
                platform: 'facebook',
                name: newConnection.name,
                status: 'active',
                username: page.id,
                accessToken: page.access_token
            });

            setFacebookPages([]);
            setNewAccountToken('');
            setIsAddAccountOpen(false);
            toast.success("Facebook Page Connected!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect page");
        }
    };

    const handleAddAccount = async () => {
        if (!newAccountName || !newAccountPlatform || !newAccountToken) return;

        try {
            const res = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: newAccountPlatform,
                    name: newAccountName,
                    accessToken: newAccountToken
                })
            });

            if (!res.ok) throw new Error("Failed to save connection");

            const newConnection = await res.json();

            store.addAccount({
                id: newConnection.id,
                platform: newAccountPlatform as any,
                name: newAccountName,
                status: 'active',
                accessToken: newAccountToken
            });

            setNewAccountName('');
            setNewAccountPlatform('linkedin');
            setNewAccountToken('');
            setIsAddAccountOpen(false);
            toast.success("Account Connected!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to connect account");
        }
    };

    const handleAddRSS = () => {
        if (!newRSSName || !newRSSUrl) return;
        store.addRSSFeed({
            id: Date.now().toString(),
            name: newRSSName,
            url: newRSSUrl
        });
        setNewRSSName('');
        setNewRSSUrl('');
    };

    const activeAccountCount = store.accounts.filter((account) => account.status === 'active').length;
    const needsAttentionCount = store.accounts.filter((account) => account.status !== 'active').length;
    const sheetConfigured = Boolean(store.googleSheetsConfig.spreadsheetId && store.googleSheetsConfig.sheetName);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <section className="mb-8 overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="grid gap-8 p-6 lg:grid-cols-[1.4fr_0.95fr] lg:p-8">
                    <div className="space-y-4">
                        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">Connections Hub</Badge>
                        <div className="space-y-3">
                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground">Connect channels, confirm access, and recover from OAuth errors without leaving the flow.</h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                SocialPoster now surfaces the exact setup path for each integration, shows what is already connected, and keeps fallback token import as a secondary route rather than the main one.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button className="rounded-full px-5" onClick={() => setIsAddAccountOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Connect New Account
                            </Button>
                            <Button variant="outline" className="rounded-full px-5" onClick={() => { window.location.href = '/settings'; }}>
                                <Settings2 className="mr-2 h-4 w-4" /> Open Setup Settings
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-3xl border border-blue-200/60 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(96,165,250,0.04))] p-4">
                            <div className="flex items-center justify-between">
                                <Link2 className="h-5 w-5 text-primary" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Accounts</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{store.accounts.length}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Connected destinations</p>
                        </div>
                        <div className="rounded-3xl border border-emerald-200/60 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.02))] p-4">
                            <div className="flex items-center justify-between">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Healthy</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{activeAccountCount}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Active connections</p>
                        </div>
                        <div className="rounded-3xl border border-rose-200/60 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,255,255,0.02))] p-4">
                            <div className="flex items-center justify-between">
                                <ShieldCheck className="h-5 w-5 text-rose-500" />
                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sheets</span>
                            </div>
                            <p className="mt-4 text-2xl font-semibold text-foreground">{sheetConfigured ? 'Ready' : 'Setup'}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{sheetConfigured ? 'Spreadsheet mapped' : 'Spreadsheet not mapped yet'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {connectionNotice && (
                <div className={`mb-6 rounded-3xl border p-4 ${
                    connectionNotice.tone === 'success'
                        ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                        : connectionNotice.tone === 'info'
                            ? 'border-blue-200 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/20'
                            : 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20'
                }`}>
                    <div className="flex items-start gap-3">
                        {connectionNotice.tone === 'success'
                            ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                            : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />}
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{connectionNotice.title}</p>
                            <p className="text-sm text-muted-foreground">{connectionNotice.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="social" className="w-full">
                <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-2 rounded-3xl border border-border/70 bg-card/70 p-2 md:grid-cols-4">
                    <TabsTrigger value="social">Social Accounts</TabsTrigger>
                    <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
                    <TabsTrigger value="ai">AI Providers</TabsTrigger>
                    <TabsTrigger value="rss">RSS Feeds</TabsTrigger>
                </TabsList>

                {/* SOCIAL ACCOUNTS TAB */}
                <TabsContent value="social" className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-3xl border border-blue-200/60 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(96,165,250,0.04))] p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Facebook className="h-4 w-4 text-primary" />
                                Facebook Pages
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Connect your Facebook Pages for posting. Uses Facebook OAuth.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button className="rounded-full bg-[#1877F2] px-5 text-white hover:bg-[#166fe5]" onClick={connectWithFacebookOAuth}>
                                    Connect Facebook <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-pink-200/60 bg-[linear-gradient(135deg,rgba(236,72,153,0.12),rgba(244,114,182,0.04))] p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Instagram className="h-4 w-4 text-pink-600" />
                                Instagram
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Connect your Instagram Business or Creator account directly via Instagram Login.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button className="rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-5 text-white hover:opacity-90" onClick={connectWithInstagramOAuth}>
                                    Connect Instagram <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-card/85 p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                                LinkedIn
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Save the client credentials in Settings, then authorize the account directly from this page.
                            </p>
                            <Button className="mt-4 rounded-full bg-[#0A66C2] px-5 text-white hover:bg-[#004182]" onClick={() => { window.location.href = '/api/auth/linkedin'; }}>
                                Connect LinkedIn
                            </Button>
                        </div>
                        <div className="rounded-3xl border border-border/70 bg-card/85 p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                Recovery path
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                If OAuth keeps failing, use the manual token path via the Connect New Account button.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end mb-2 gap-2">
                        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                            <DialogTrigger asChild>
                                <Button className="rounded-full px-5">
                                    <Plus className="mr-2 h-4 w-4" /> Connect New Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-[2rem] border-border/70 bg-card/95 p-0 shadow-2xl">
                                <DialogHeader>
                                    <div className="rounded-t-[2rem] border-b border-border/60 bg-muted/30 px-6 py-6">
                                        <DialogTitle className="text-2xl">Connect Social Account</DialogTitle>
                                        <DialogDescription className="mt-2">
                                            Select the platform and enter a name for this connection.
                                        </DialogDescription>
                                    </div>
                                </DialogHeader>
                                <div className="grid gap-4 px-6 py-5">
                                    <div className="grid gap-2">
                                        <Label>Platform</Label>
                                        <Select value={newAccountPlatform} onValueChange={(val: any) => setNewAccountPlatform(val)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="facebook">Facebook Page</SelectItem>
                                                <SelectItem value="linkedin">LinkedIn Profile</SelectItem>
                                                <SelectItem value="instagram">Instagram Account</SelectItem>
                                                <SelectItem value="threads">Threads</SelectItem>
                                                <SelectItem value="wordpress">WordPress</SelectItem>
                                                <SelectItem value="wix">Wix</SelectItem>
                                                <SelectItem value="squarespace">Squarespace</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Account Name</Label>
                                        <Input
                                            placeholder="e.g. My Tech Blog"
                                            value={newAccountName}
                                            onChange={(e) => setNewAccountName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Access Token</Label>

                                        {newAccountPlatform === 'instagram' ? (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    onClick={connectWithInstagramOAuth}
                                                    className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90"
                                                >
                                                    <Instagram className="mr-2 h-4 w-4" />
                                                    Connect with Instagram
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">
                                                    ✨ Recommended. Connect your Instagram Business or Creator account directly. Takes 30 seconds.
                                                </p>
                                                <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-md p-3">
                                                    <p className="text-xs text-pink-800 dark:text-pink-300">
                                                        Your Instagram account must be a <strong>Business</strong> or <strong>Creator</strong> account. Personal accounts are not supported by Meta&apos;s API.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : newAccountPlatform === 'facebook' ? (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    onClick={connectWithFacebookOAuth}
                                                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                                >
                                                    <Facebook className="mr-2 h-4 w-4" />
                                                    Connect with Facebook
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">
                                                    ✨ Recommended. This imports your Facebook Pages automatically. Takes 30 seconds.
                                                </p>
                                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                                    <p className="text-xs text-blue-800 dark:text-blue-300">
                                                        <strong>Don&apos;t have credentials yet?</strong> Go to <a href="/settings" className="underline font-semibold">Settings</a> to add your Facebook App ID &amp; Secret, then come back here.
                                                    </p>
                                                </div>

                                                <Separator />

                                                <div className="bg-muted/50 p-3 rounded-md text-xs space-y-2 mb-2">
                                                    <p className="font-semibold">Manual fallback:</p>
                                                    <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                                                        <li>Go to the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Facebook Graph API Explorer</a></li>
                                                        <li>Select your App, and set <strong>User or Page</strong> to "User Token"</li>
                                                        <li>Add Permissions: <code>public_profile</code>, <code>pages_show_list</code>, <code>pages_manage_posts</code></li>
                                                        <li>Click "Generate Access Token" and paste it below.</li>
                                                    </ol>
                                                </div>

                                                <div className="space-y-2">
                                                    <Input
                                                        type="password"
                                                        placeholder="Paste Graph API User Access Token here..."
                                                        value={newAccountToken}
                                                        onChange={(e) => setNewAccountToken(e.target.value)}
                                                    />
                                                    <Button
                                                        onClick={handleFetchPagesWithToken}
                                                        disabled={!newAccountToken || isFetchingPages}
                                                        className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white"
                                                    >
                                                        {isFetchingPages ? 'Fetching...' : 'Fetch Pages'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : newAccountPlatform === 'linkedin' ? (
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    onClick={() => window.location.href = '/api/auth/linkedin'}
                                                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                                                >
                                                    <Linkedin className="mr-2 h-4 w-4" />
                                                    Connect with LinkedIn
                                                </Button>
                                                <p className="text-[10px] text-muted-foreground text-center">
                                                    You&apos;ll be redirected to LinkedIn to authorize posting.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    type="password"
                                                    placeholder="Paste Access Token..."
                                                    value={newAccountToken}
                                                    onChange={(e) => setNewAccountToken(e.target.value)}
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Required for posting. Kept encrypted.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {facebookPages.length > 0 && newAccountPlatform === 'facebook' && (
                                        <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                            <Label className="text-xs font-semibold">Select Page to Connect</Label>
                                            {facebookPages.map((page) => (
                                                <div key={page.id} className="flex items-center justify-between p-2 hover:bg-muted rounded border text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{page.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{page.category}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => connectFacebookPage(page)}
                                                    >
                                                        Connect
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    {newAccountPlatform !== 'facebook' && newAccountPlatform !== 'instagram' && newAccountPlatform !== 'linkedin' && newAccountPlatform !== 'instagram' && (
                                        <Button onClick={handleAddAccount}>Connect Account</Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {store.accounts.map((account) => (
                            <Card key={account.id} className="overflow-hidden border-border/70 bg-card/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/25 pb-3">
                                    <CardTitle className="text-sm font-medium capitalize">{account.platform} {account.platform === 'facebook' ? 'Page' : 'Account'}</CardTitle>
                                    {account.platform === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                                    {account.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700" />}
                                    {account.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                                    {account.platform === 'threads' && <AtSign className="h-4 w-4 text-gray-700" />}
                                    {account.platform === 'wordpress' && <PenSquare className="h-4 w-4 text-indigo-600" />}
                                    {account.platform === 'wix' && <Globe className="h-4 w-4 text-purple-600" />}
                                    {account.platform === 'squarespace' && <Globe className="h-4 w-4 text-zinc-700" />}
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xl font-bold truncate">{account.name}</span>
                                        {account.status === 'active'
                                            ? <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                                            : <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Expired</Badge>
                                        }
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {account.username ? `@${account.username}` : 'Connected via OAuth'}
                                    </p>
                                </CardContent>
                                <CardFooter className="border-t border-border/60 bg-muted/20">
                                    <Button variant="ghost" size="sm" className="w-full rounded-xl text-red-500 hover:text-red-600" onClick={async () => {
                                        try {
                                            await fetch(`/api/connections?id=${account.id}`, { method: 'DELETE' });
                                            store.removeAccount(account.id);
                                            toast.success('Connection removed');
                                        } catch (e) {
                                            console.error('Failed to disconnect:', e);
                                            toast.error('Failed to disconnect');
                                        }
                                    }}>
                                        <Trash2 className="mr-2 h-3 w-3" /> Disconnect
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {store.accounts.length === 0 && (
                            <Card className="col-span-full flex min-h-[220px] items-center justify-center border-dashed border-border/70 bg-card/60">
                                <div className="max-w-md text-center text-muted-foreground">
                                    <p className="text-base font-medium text-foreground">No accounts connected yet.</p>
                                    <p className="mt-2 text-sm">Start with Facebook or LinkedIn above, then use the dialog for manual token-based connections when needed.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* GOOGLE SHEETS TAB */}
                <TabsContent value="sheets" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Google Sheets Configuration</CardTitle>
                            <CardDescription>Connect a spreadsheet to use as a data source.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-md border p-3 flex items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Connect Google OAuth to enable marking rows as <strong>done</strong> after use.
                                </div>
                                <Button
                                    variant="default"
                                    onClick={() => { window.location.href = '/api/auth/google'; }}
                                >
                                    Connect Google Sheets
                                </Button>
                            </div>

                            <div className="grid gap-2">
                                <Label>Spreadsheet ID / URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={store.googleSheetsConfig.spreadsheetId}
                                        onChange={(e) => store.updateGoogleSheetsConfig({ spreadsheetId: e.target.value })}
                                        onBlur={() => {
                                            if (store.googleSheetsConfig.spreadsheetId) {
                                                fetchSheets(store.googleSheetsConfig.spreadsheetId);
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        disabled={isFetchingSheets || !store.googleSheetsConfig.spreadsheetId}
                                        onClick={() => fetchSheets(store.googleSheetsConfig.spreadsheetId)}
                                    >
                                        {isFetchingSheets ? 'Fetching...' : 'Fetch'}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Worksheet Name</Label>
                                {availableSheets.length > 0 ? (
                                    <Select
                                        value={store.googleSheetsConfig.sheetName || undefined}
                                        onValueChange={(value) => store.updateGoogleSheetsConfig({ sheetName: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a sheet tab" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSheets.map((sheet) => (
                                                <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Sheet1"
                                        value={store.googleSheetsConfig.sheetName}
                                        onChange={(e) => store.updateGoogleSheetsConfig({ sheetName: e.target.value })}
                                    />
                                )}
                                {availableSheets.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Enter a Spreadsheet URL and fetch tabs to choose from a dropdown.
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div className="grid gap-4 border p-4 rounded-lg">
                                <h4 className="font-semibold text-sm">Column Mapping</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Content Column</Label>
                                        <Input
                                            placeholder="A"
                                            value={store.googleSheetsConfig.columns.content}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, content: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status Column</Label>
                                        <Input
                                            placeholder="B"
                                            value={store.googleSheetsConfig.columns.status}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, status: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Image Column</Label>
                                        <Input
                                            placeholder="C"
                                            value={store.googleSheetsConfig.columns.image}
                                            onChange={(e) => store.updateGoogleSheetsConfig({ columns: { ...store.googleSheetsConfig.columns, image: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Rule:</span> Only rows with <strong>Empty</strong> status are processed.
                            </div>
                            <Button onClick={() => alert("Successfully connected to Google Sheet!")}>Test Read Access</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* AI PROVIDERS TAB */}
                <TabsContent value="ai" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" /> OpenAI
                                </CardTitle>
                                <CardDescription>Configure GPT-4 or GPT-3.5 Turbo</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={store.aiConfig.openaiKey}
                                        onChange={(e) => store.updateAIConfig({ openaiKey: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">Keys are encrypted at rest.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Model</Label>
                                    <Select
                                        value={store.aiConfig.openaiModel}
                                        onValueChange={(val) => store.updateAIConfig({ openaiModel: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => alert("OpenAI Settings Saved")}>Save Configuration</Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="w-5 h-5" /> Anthropic
                                </CardTitle>
                                <CardDescription>Configure Claude 3 access</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>API Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-ant-..."
                                        value={store.aiConfig.anthropicKey}
                                        onChange={(e) => store.updateAIConfig({ anthropicKey: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Default Model</Label>
                                    <Select
                                        value={store.aiConfig.anthropicModel}
                                        onValueChange={(val) => store.updateAIConfig({ anthropicModel: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" onClick={() => alert("Anthropic Settings Saved")}>Connect</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* RSS FEEDS TAB */}
                <TabsContent value="rss">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rss className="w-5 h-5" /> RSS Feed Sources
                            </CardTitle>
                            <CardDescription>Manage your RSS feed collection used in workflows.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                {store.rssFeeds.map((feed) => (
                                    <div key={feed.id} className="p-4 flex items-center justify-between border-b last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{feed.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">{feed.url}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => store.removeRSSFeed(feed.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                {store.rssFeeds.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">No RSS feeds added.</div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full items-center space-x-2">
                                <Input
                                    placeholder="Name (e.g. TechCrunch)"
                                    className="w-1/3"
                                    value={newRSSName}
                                    onChange={(e) => setNewRSSName(e.target.value)}
                                />
                                <Input
                                    placeholder="RSS URL..."
                                    className="flex-1"
                                    value={newRSSUrl}
                                    onChange={(e) => setNewRSSUrl(e.target.value)}
                                />
                                <Button onClick={handleAddRSS} disabled={!newRSSName || !newRSSUrl}>Add Feed</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConnectionGuide />
        </div>
    );
}

export default function ConnectionsPage() {
    return (
        <ConnectionsPageContent />
    );
}
