'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Activity, AlertTriangle, CheckCircle2, Calendar, Loader2, Wand2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalWorkflows: number;
    activeWorkflows: number;
}

interface PersonaData {
    brandVoiceSummary: string;
    contentPillars: string[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [persona, setPersona] = useState<PersonaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/workflows').then(res => res.json()),
            fetch('/api/personas').then(res => res.json()),
        ]).then(([workflowData, personaData]) => {
            if (Array.isArray(workflowData)) {
                setStats({
                    totalWorkflows: workflowData.length,
                    activeWorkflows: workflowData.filter((w: any) => w.isActive).length,
                });
            } else {
                setStats({ totalWorkflows: 0, activeWorkflows: 0 });
            }

            if (personaData && personaData.personaData) {
                setPersona(personaData.personaData);
            }
            setIsLoading(false);
        }).catch(() => {
            setStats({ totalWorkflows: 0, activeWorkflows: 0 });
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return <div className="flex h-full items-center justify-center py-20"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your social automation activity.</p>
                </div>
                <Link href="/editor/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Workflow
                    </Button>
                </Link>
            </div>

            {/* STATS CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalWorkflows ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeWorkflows ?? 0} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeWorkflows ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Draft Workflows</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalWorkflows ?? 0) - (stats?.activeWorkflows ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">Not yet activated</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <Link href="/editor/new">
                            <Button variant="outline" size="sm" className="w-full">
                                <Plus className="mr-2 h-3 w-3" /> Create Workflow
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* AI PERSONA CARD */}
            <div className="mb-8">
                {persona ? (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wand2 className="h-5 w-5" />
                                    Your AI Persona
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Your brand voice and content strategy</p>
                            </div>
                            <Link href="/persona">
                                <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">{persona.brandVoiceSummary}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">Content Pillars:</p>
                                <div className="flex flex-wrap gap-2">
                                    {persona.contentPillars.map((pillar, i) => (
                                        <span key={i} className="inline-block px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-medium">
                                            {pillar}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wand2 className="h-5 w-5" />
                                    Create Your AI Persona
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Get personalized content recommendations based on your brand voice</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/persona">
                                <Button>
                                    <Wand2 className="mr-2 h-4 w-4" /> Create Persona
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* GETTING STARTED */}
            {(stats?.totalWorkflows ?? 0) === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Get Started</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            You have no workflows yet. Create your first workflow to start automating your social media posts.
                        </p>
                        <Link href="/editor/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Your First Workflow
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
