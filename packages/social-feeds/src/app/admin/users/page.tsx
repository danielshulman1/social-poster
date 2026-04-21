"use client";
export const dynamic = 'force-dynamic';

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Lock, AlertCircle, Trash2, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { TIER_CONFIG, TIER_ORDER, TIER_OPTIONS } from "@/lib/tiers";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    workflowCount: number;
    subscription?: {
        status: string;
        plan: string | null;
    };
    persona?: {
        hasPersona: boolean;
        auditUsed: boolean;
        authorizedAt: string | null;
        locked: boolean;
        canAuthorize: boolean;
    };
}

interface NewUserForm {
    name: string;
    email: string;
    password: string;
    role: string;
    tier: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authorizing, setAuthorizing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [savingTierFor, setSavingTierFor] = useState<string | null>(null);
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState<NewUserForm>({
        name: "",
        email: "",
        password: "",
        role: "user",
        tier: TIER_OPTIONS.STARTER,
    });

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
            setSelectedTiers(
                Object.fromEntries(
                    data.map((user: User) => [user.id, user.subscription?.plan || TIER_OPTIONS.STARTER])
                )
            );
        } catch {
            toast.error("Error fetching users");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role !== "admin") {
                toast.error("Unauthorized: Admins only");
                router.push("/dashboard");
                return;
            }
            queueMicrotask(() => {
                void fetchUsers();
            });
        }
    }, [status, session, router, fetchUsers]);

    const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreatingUser(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to create user");
            }

            toast.success(`Account created for ${data.email}`);
            setIsCreateDialogOpen(false);
            setNewUser({
                name: "",
                email: "",
                password: "",
                role: "user",
                tier: TIER_OPTIONS.STARTER,
            });
            await fetchUsers();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create user");
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleAuthorizeAudit = async (userId: string) => {
        setAuthorizing(userId);
        try {
            const res = await fetch("/api/admin/personas/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error("Failed to authorize");

            toast.success("User authorized for one more persona audit");
            fetchUsers(); // Refresh list
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to authorize audit");
        } finally {
            setAuthorizing(null);
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        setDeleting(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to delete user");
            }

            toast.success(`User ${userEmail} has been deleted`);
            fetchUsers(); // Refresh list
        } catch (error: unknown) {
            console.error("Delete error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete user");
        } finally {
            setDeleting(null);
        }
    };

    const handleTierSave = async (userId: string) => {
        const tier = selectedTiers[userId] || TIER_OPTIONS.STARTER;
        setSavingTierFor(userId);

        try {
            const res = await fetch("/api/admin/users/tier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, tier }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || "Failed to update tier");
            }

            toast.success(`Tier updated to ${TIER_CONFIG[tier as keyof typeof TIER_CONFIG]?.name || tier}`);
            await fetchUsers();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to update tier");
        } finally {
            setSavingTierFor(null);
        }
    };

    if (isLoading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="page-shell space-y-6">
            <section className="page-hero">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                        <span className="page-kicker">Admin Console</span>
                        <div>
                            <h1 className="text-4xl font-semibold tracking-[-0.05em]">Manage users, tiers, and persona access from one place.</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                                Tier changes, audit authorization, and destructive actions now sit in a structured operating panel instead of a plain back-office table.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="metric-panel">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Users</p>
                            <p className="mt-3 text-3xl font-semibold">{users.length}</p>
                        </div>
                        <div className="metric-panel">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Active Subs</p>
                            <p className="mt-3 text-3xl font-semibold">{users.filter((user) => user.subscription?.status === "active").length}</p>
                        </div>
                        <div className="metric-panel">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Admins</p>
                            <p className="mt-3 text-3xl font-semibold">{users.filter((user) => user.role === "admin").length}</p>
                        </div>
                    </div>
                </div>
            </section>

            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>Manage application users and view subscription status</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                                <UserPlus className="w-4 h-4" />
                                Create Account
                            </Button>
                            <Button onClick={fetchUsers} variant="outline" size="sm">Refresh</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Persona Audit</TableHead>
                                <TableHead>Workflows</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex min-w-[220px] items-center gap-2">
                                            <Select
                                                value={selectedTiers[user.id] || TIER_OPTIONS.STARTER}
                                                onValueChange={(value) =>
                                                    setSelectedTiers((current) => ({
                                                        ...current,
                                                        [user.id]: value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue placeholder="Select tier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIER_ORDER.map((tierId) => (
                                                        <SelectItem key={tierId} value={tierId}>
                                                            {TIER_CONFIG[tierId].name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleTierSave(user.id)}
                                                disabled={savingTierFor === user.id || (selectedTiers[user.id] || TIER_OPTIONS.STARTER) === (user.subscription?.plan || TIER_OPTIONS.STARTER)}
                                            >
                                                {savingTierFor === user.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Save className="w-3 h-3" />
                                                )}
                                                Save
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.subscription ? (
                                            <Badge variant={user.subscription.status === "active" ? "default" : "outline"} className={user.subscription.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {user.subscription.plan || "none"} ({user.subscription.status})
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">No subscription</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!user.persona ? (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        ) : user.persona.locked ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="destructive" className="gap-1">
                                                    <Lock className="w-3 h-3" />
                                                    Locked
                                                </Badge>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    onClick={() => handleAuthorizeAudit(user.id)}
                                                    disabled={authorizing === user.id}
                                                    className="text-xs"
                                                >
                                                    {authorizing === user.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        "Authorize"
                                                    )}
                                                </Button>
                                            </div>
                                        ) : user.persona.authorizedAt ? (
                                            <Badge variant="outline" className="gap-1 bg-yellow-50">
                                                <AlertCircle className="w-3 h-3" />
                                                Authorized
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="gap-1 bg-green-50">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.workflowCount}</TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                            disabled={deleting === user.id || user.role === "admin"}
                                            className="gap-1"
                                        >
                                            {deleting === user.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create User Account</DialogTitle>
                        <DialogDescription>
                            Create a login for a new user and assign their starting role and tier.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-user-name">Name</Label>
                            <Input
                                id="new-user-name"
                                value={newUser.name}
                                onChange={(event) => setNewUser((current) => ({ ...current, name: event.target.value }))}
                                placeholder="Jane Smith"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-user-email">Email</Label>
                            <Input
                                id="new-user-email"
                                type="email"
                                required
                                value={newUser.email}
                                onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
                                placeholder="jane@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-user-password">Temporary Password</Label>
                            <Input
                                id="new-user-password"
                                type="password"
                                required
                                minLength={8}
                                value={newUser.password}
                                onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
                                placeholder="At least 8 characters"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(value) => setNewUser((current) => ({ ...current, role: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tier</Label>
                                <Select
                                    value={newUser.tier}
                                    onValueChange={(value) => setNewUser((current) => ({ ...current, tier: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIER_ORDER.map((tierId) => (
                                            <SelectItem key={tierId} value={tierId}>
                                                {TIER_CONFIG[tierId].name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateDialogOpen(false)}
                                disabled={isCreatingUser}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingUser}>
                                {isCreatingUser ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                                Create Account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
