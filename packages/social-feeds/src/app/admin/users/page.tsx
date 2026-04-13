"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Lock, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    workflowCount: number;
    subscription?: {
        status: string;
        plan: string;
    };
    persona?: {
        hasPersona: boolean;
        auditUsed: boolean;
        authorizedAt: string | null;
        locked: boolean;
        canAuthorize: boolean;
    };
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authorizing, setAuthorizing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role !== "admin") {
                toast.error("Unauthorized: Admins only");
                router.push("/dashboard");
                return;
            }
            fetchUsers();
        }
    }, [status, session, router]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Error fetching users");
        } finally {
            setIsLoading(false);
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
        } catch (error: any) {
            toast.error(error.message || "Failed to authorize audit");
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
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error?.message || "Failed to delete user");
        } finally {
            setDeleting(null);
        }
    };

    if (isLoading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>Manage application users and view subscription status</CardDescription>
                        </div>
                        <Button onClick={fetchUsers} variant="outline" size="sm">Refresh</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
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
                                        {user.subscription ? (
                                            <Badge variant={user.subscription.status === "active" ? "default" : "outline"} className={user.subscription.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {user.subscription.plan || "Free"} ({user.subscription.status})
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Free</span>
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
        </div>
    );
}
