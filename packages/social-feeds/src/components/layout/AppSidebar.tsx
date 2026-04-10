'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Workflow,
    Radio,
    Settings,
    Activity,
    LogOut,
    Shield,
    Sparkles,
    ArrowUpRight
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/', label: 'Workflows', icon: Workflow }, // Canvas is home for now, or move to /workflows
    { href: '/connections', label: 'Connections', icon: Radio },
    { href: '/activity', label: 'Activity Log', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="border-b border-sidebar-border p-5">
                <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(37,99,235,0.22),rgba(244,63,94,0.14))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl bg-white/10 p-2 text-white">
                            <Sparkles size={18} />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72">
                            Live Stack
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Social Poster</h1>
                    <p className="mt-1 text-sm text-white/72">
                        Publish, connect, and operate every channel from one control surface.
                    </p>
                </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                <div className="space-y-1">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                        Command Deck
                    </p>
                    <div className="space-y-1.5">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-950/20"
                                    : "text-white/72 hover:bg-sidebar-accent hover:text-white"
                            )}
                        >
                            <span className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                                isActive ? "border-white/20 bg-white/12" : "border-white/8 bg-white/4 group-hover:border-white/12 group-hover:bg-white/6"
                            )}>
                                <Icon size={18} />
                            </span>
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ArrowUpRight size={16} className="opacity-90" />}
                        </Link>
                    );
                })}
                    </div>
                </div>

                {session?.user?.role === 'admin' && (
                    <div className="space-y-1">
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                            Admin
                        </p>
                        <Link
                            href="/admin/users"
                            className={cn(
                                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                                pathname === "/admin/users"
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-950/20"
                                    : "text-white/72 hover:bg-sidebar-accent hover:text-white"
                            )}
                        >
                            <span className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                                pathname === "/admin/users" ? "border-white/20 bg-white/12" : "border-white/8 bg-white/4 group-hover:border-white/12 group-hover:bg-white/6"
                            )}>
                                <Shield size={18} />
                            </span>
                            <span className="flex-1">Admin Users</span>
                            {pathname === "/admin/users" && <ArrowUpRight size={16} className="opacity-90" />}
                        </Link>
                    </div>
                )}
            </nav>

            <div className="space-y-4 border-t border-sidebar-border p-4">
                {session?.user && (
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                        <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                            {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-white">{session.user.name}</p>
                            <p className="truncate text-xs text-white/55">{session.user.email}</p>
                        </div>
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    className="flex w-full items-center justify-start gap-3 rounded-2xl px-3 py-3 text-white/72 hover:bg-sidebar-accent hover:text-white"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
