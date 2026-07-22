import { NextResponse } from "next/server";
import { getApiAuthContext, unauthorizedJson } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

type OpenRouterModel = {
    id: string;
    name?: string;
    architecture?: {
        output_modalities?: string[];
    };
    pricing?: {
        image?: string;
    };
};

let cachedModels: { id: string; name: string }[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

// GET the list of OpenRouter models that support image output, for populating
// the Image Generation node's model picker. Public model catalog, no user
// API key required.
export async function GET(req: Request) {
    const auth = await getApiAuthContext(req);
    if (!auth?.userId) return unauthorizedJson();

    if (cachedModels && Date.now() - cachedAt < CACHE_TTL_MS) {
        return NextResponse.json({ models: cachedModels });
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        if (cachedModels) {
            return NextResponse.json({ models: cachedModels });
        }
        return NextResponse.json({ error: "Failed to load OpenRouter models" }, { status: 502 });
    }

    const data = await response.json().catch(() => null);
    const allModels: OpenRouterModel[] = Array.isArray(data?.data) ? data.data : [];

    const imageModels = allModels
        .filter((m) => m.architecture?.output_modalities?.includes("image"))
        .map((m) => ({ id: m.id, name: m.name || m.id }))
        .sort((a, b) => a.name.localeCompare(b.name));

    cachedModels = imageModels;
    cachedAt = Date.now();

    return NextResponse.json({ models: imageModels });
}
