"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Canvas } from '@/components/workflow/Canvas';
import { EditorHeader } from '@/components/workflow/EditorHeader';
import { useWorkflowStore } from '@/lib/store';
import { toast } from 'sonner';
import { useParams } from "next/navigation";

export default function EditorPage() {
    const params = useParams();
    const workflowId = params.workflowId as string;
    const sessionStorageKey = workflowId ? `workflow-draft:${workflowId}` : "";

    const [workflowName, setWorkflowName] = useState("Loading...");
    const [isSaving, setIsSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { setNodes, setEdges, nodes, edges } = useWorkflowStore();

    useEffect(() => {
        if (!workflowId) return;

        if (typeof window !== 'undefined' && sessionStorageKey) {
            const cachedDraft = window.sessionStorage.getItem(sessionStorageKey);
            if (cachedDraft) {
                try {
                    const parsed = JSON.parse(cachedDraft);
                    if (typeof parsed?.name === 'string' && parsed.name.trim()) {
                        setWorkflowName(parsed.name);
                    }
                    if (parsed?.definition?.nodes) {
                        setNodes(parsed.definition.nodes);
                    }
                    if (parsed?.definition?.edges) {
                        setEdges(parsed.definition.edges);
                    }
                } catch (error) {
                    console.error('Failed to read generated workflow draft from session storage', error);
                }
            }
        }

        fetch(`/api/workflows/${workflowId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load workflow");
                return res.json();
            })
            .then(data => {
                setWorkflowName(data.name);
                if (data.definition) {
                    const def = typeof data.definition === 'string' ? JSON.parse(data.definition) : data.definition;
                    if (def.nodes) setNodes(def.nodes);
                    if (def.edges) setEdges(def.edges);
                }
                if (typeof window !== 'undefined' && sessionStorageKey) {
                    window.sessionStorage.removeItem(sessionStorageKey);
                }
            })
            .catch(err => {
                console.error(err);
                toast.error("Failed to load workflow");
            });
    }, [workflowId, sessionStorageKey, setNodes, setEdges]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const definition = { nodes, edges };
            const res = await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workflowName, definition }),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Workflow saved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRun = async () => {
        // Auto-save first
        setIsRunning(true);
        try {
            const definition = { nodes, edges };
            await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workflowName, definition }),
            });

            const res = await fetch(`/api/workflows/${workflowId}/execute`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Execution failed', {
                    description: data.executionId
                        ? `Run log saved under ${data.executionId}. Open Activity Log for the failure trail.`
                        : 'Open Activity Log for the failure trail.',
                });
                return;
            }

            if (data.status === 'completed') {
                toast.success('Workflow executed successfully!');
                // Show outputs in a readable way
                const results = data.results || {};
                for (const [nodeId, result] of Object.entries(results)) {
                    const r = result as any;
                    if (r.output && r.output.length > 0) {
                        const node = nodes.find((n: any) => n.id === nodeId);
                        const label = (node?.data?.label as string) || nodeId;
                        toast.message(`${label}`, {
                            description: r.output.substring(0, 200) + (r.output.length > 200 ? '...' : ''),
                            duration: 10000,
                        });
                    }
                }
            } else {
                toast.warning('Workflow completed with errors', {
                    description: 'Open Activity Log to review the run trail and failure reasons.',
                });
                const results = data.results || {};
                for (const [nodeId, result] of Object.entries(results)) {
                    const r = result as any;
                    if (r.status === 'failed') {
                        const node = nodes.find((n: any) => n.id === nodeId);
                        const label = (node?.data?.label as string) || nodeId;
                        toast.error(`${label}: ${r.error}`);
                    }
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to execute workflow");
        } finally {
            setIsRunning(false);
        }
    };

    const handleGenerateFromPrompt = async (prompt: string) => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/workflows/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data) {
                throw new Error(data?.error || 'Failed to generate workflow');
            }

            const definition = data.definition || { nodes: [], edges: [] };
            const nextName = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : workflowName;

            const saveRes = await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nextName, definition }),
            });

            if (!saveRes.ok) {
                const saveData = await saveRes.json().catch(() => null);
                throw new Error(saveData?.error || 'Failed to save generated workflow');
            }

            setWorkflowName(nextName);
            setNodes(definition.nodes || []);
            setEdges(definition.edges || []);

            toast.success('Workflow generated');

            if (Array.isArray(data.warnings) && data.warnings.length > 0) {
                toast.message('Review generated setup', {
                    description: data.warnings.slice(0, 2).join(' '),
                    duration: 10000,
                });
            }
            return true;
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Failed to generate workflow');
            return false;
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-[var(--app-shell-min-height)] min-h-[var(--app-shell-min-height)] flex-col">
            <EditorHeader
                workflowName={workflowName}
                workflowId={workflowId}
                onSave={handleSave}
                onNameChange={(name) => setWorkflowName(name)}
                onRun={handleRun}
                isSaving={isSaving}
                isRunning={isRunning}
                isGenerating={isGenerating}
                isDirty={false}
                onGenerateFromPrompt={handleGenerateFromPrompt}
            />
            <div className="flex-1 overflow-hidden">
                <Canvas />
            </div>
        </div>
    );
}
