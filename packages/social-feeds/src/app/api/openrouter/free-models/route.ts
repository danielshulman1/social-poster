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
        prompt?: string;
        completion?: string;
    };
};

let cachedModels: { id: string; name: string }[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

const isFreeModel = (m: OpenRouterModel) => {
    if (m.id.endsWith(":free")) return true;
    const prompt = parseFloat(m.pricing?.prompt ?? "1");
    const completion = parseFloat(m.pricing?.completion ?? "1");
    return prompt === 0 && completion === 0;
};

// GET the list of OpenRouter chat models that are free to use (no OpenRouter
// credits required), for populating the AI Generation / Blog Creation node's
// OpenRouter model picker. Public model catalog, no user API key required.
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

    const freeModels = allModels
        .filter((m) => m.architecture?.output_modalities?.includes("text") && isFreeModel(m))
        .map((m) => ({ id: m.id, name: m.name || m.id }))
        .sort((a, b) => a.name.localeCompare(b.name));

    cachedModels = freeModels;
    cachedAt = Date.now();

    return NextResponse.json({ models: freeModels });
}
