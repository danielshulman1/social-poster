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
    ArrowUpRight,
    Wand2,
    ListChecks,
    LifeBuoy
} from 'lucide-react';

const menuItems = [
    { href: '/onboarding', label: 'Onboarding', icon: ListChecks },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/', label: 'Workflows', icon: Workflow }, // Canvas is home for now, or move to /workflows
    { href: '/persona', label: 'AI Persona', icon: Wand2 },
    { href: '/connections', label: 'Connections', icon: Radio },
    { href: '/activity', label: 'Activity Log', icon: Activity },
    { href: '/help', label: 'User Guide', icon: LifeBuoy },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const visibleMenuItems = session?.user?.role === 'admin'
        ? menuItems.filter((item) => item.href !== '/onboarding')
        : menuItems;

    return (
        <aside className="w-full border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-[var(--app-shell-min-height)] lg:max-h-[var(--app-shell-min-height)] lg:w-80 lg:flex-col lg:overflow-hidden lg:border-r lg:border-b-0">
            <div className="border-b border-sidebar-border p-4 lg:p-5">
                <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(229,140,98,0.18),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white">
                            <Sparkles size={18} />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72">
                            Control Room
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Social Poster</h1>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-white/72">
                        Plan, connect, and run every publishing workflow from one editorial command deck.
                    </p>
                </div>
            </div>

            <nav className="flex-1 overflow-x-auto p-4 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto">
                <div className="space-y-4">
                    <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                        Command Deck
                    </p>
                    <div className="flex gap-2 lg:flex-col lg:gap-1.5">
                {visibleMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex min-w-fit items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer lg:min-w-0",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
                                    : "text-white/72 hover:bg-sidebar-accent hover:text-white"
                            )}
                        >
                            <span className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
                                isActive ? "border-white/20 bg-white/12" : "border-white/8 bg-white/4 group-hover:border-white/12 group-hover:bg-white/6"
                            )}>
                                <Icon size={18} />
                            </span>
                            <span className="flex-1 whitespace-nowrap">{item.label}</span>
                            {isActive && <ArrowUpRight size={16} className="hidden opacity-90 lg:block" />}
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
                        <div className="flex gap-2 lg:flex-col lg:gap-1.5">
                            <Link
                                href="/admin/users"
                                className={cn(
                                    "group flex min-w-fit items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer lg:min-w-0",
                                    pathname === "/admin/users"
                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
                                        : "text-white/72 hover:bg-sidebar-accent hover:text-white"
                                )}
                            >
                                <span className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
                                    pathname === "/admin/users" ? "border-white/20 bg-white/12" : "border-white/8 bg-white/4 group-hover:border-white/12 group-hover:bg-white/6"
                                )}>
                                    <Shield size={18} />
                                </span>
                                <span className="flex-1 whitespace-nowrap">Admin Users</span>
                                {pathname === "/admin/users" && <ArrowUpRight size={16} className="hidden opacity-90 lg:block" />}
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            <div className="space-y-4 border-t border-sidebar-border p-4">
                {session?.user && (
                    <div className="rounded-[1.6rem] border border-white/8 bg-white/4 p-3">
                        <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
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
        </aside>
    );
}
