export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  buildWorkflowDefinitionFromBlueprint,
  parseWorkflowGenerationBlueprint,
} from "@/lib/workflow-generation";
import { assertWorkflowDefinitionAllowed, isTierAccessError } from "@/lib/tier-access";

type RouteError = Error & {
  code?: string;
  status?: number;
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  threads: "Threads",
  wordpress: "WordPress",
  wix: "Wix",
  squarespace: "Squarespace",
  google: "Google",
};

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const buildPersonaPrompt = (personaData: unknown) => {
  if (!personaData || typeof personaData !== "object" || Array.isArray(personaData)) {
    return "";
  }

  const record = personaData as Record<string, unknown>;
  const brandVoiceSummary = getString(record.brandVoiceSummary);
  const contentPillars = Array.isArray(record.contentPillars)
    ? record.contentPillars.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  if (!brandVoiceSummary && contentPillars.length === 0) {
    return "";
  }

  return [
    brandVoiceSummary ? `Brand voice: ${brandVoiceSummary}` : "",
    contentPillars.length > 0 ? `Content pillars: ${contentPillars.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const extractJsonPayload = (responseText: string) => {
  try {
    return responseText;
  } catch {
    return responseText;
  }
};

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText("Unauthorized");

  try {
    const body = await req.json();
    const prompt = getString(body.prompt);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const [user, connections, persona] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { openaiApiKey: true },
      }),
      prisma.externalConnection.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.userPersona.findUnique({
        where: { userId: auth.userId },
      }),
    ]);

    const apiKey = user?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add one in Settings first." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const connectionSummary = connections.map((connection) => ({
      id: connection.id,
      platform: connection.provider,
      platformLabel: PLATFORM_LABELS[connection.provider] || connection.provider,
      name: connection.name || connection.provider,
    }));

    const personaPrompt = buildPersonaPrompt(persona?.personaData);

    const systemPrompt = `You generate simple, valid social media workflow blueprints.

Return JSON only, with this shape:
{
  "name": "Workflow name",
  "steps": [
    {
      "type": "manual-trigger | schedule-trigger | rss-source | google-sheets-source | ai-generation | blog-creation | image-generation | router | facebook-publisher | linkedin-publisher | instagram-publisher | threads-publisher | wordpress-publisher | wix-publisher | squarespace-publisher | http-request | google-sheets-publisher",
      "label": "Short node label",
      "data": {}
    }
  ]
}

Rules:
- Build a single sequential workflow. No branching.
- If the request does not mention timing, start with "manual-trigger".
- If the workflow starts from a plain brief instead of RSS or Google Sheets, put that brief in manual-trigger data.testContent.
- If the request mentions recurring timing, use "schedule-trigger" and include data.schedules as an array of { "day": "Monday", "time": "09:00" } in 24-hour time.
- Use "rss-source" when the user mentions news, RSS, feeds, or article URLs.
- Use "google-sheets-source" when the user mentions Google Sheets, spreadsheet rows, or posting from a sheet.
- Use "ai-generation" when copy needs to be written or rewritten.
- Use "blog-creation" only when the user explicitly wants a blog post.
- Use "image-generation" only when the user asks for an AI-generated image.
- For a publisher node, include data.accountId only if one of the provided connection IDs clearly matches the requested destination.
- If the workflow should wait for approval, set data.publishWithoutApproval to false.
- If a publisher should use the image from a Google Sheets row, set data.imageSource to "google-sheet".
- If a publisher should use an AI image node, set data.imageSource to "image-generated".
- Keep data minimal. Only include fields you are confident about.
- Never invent connection IDs that are not in the provided list.`;

    const userPrompt = `User request:
${prompt}

Available connected destinations:
${JSON.stringify(connectionSummary, null, 2)}

Persona context for writing nodes:
${personaPrompt || "None"}

Return only valid JSON.`;

    const message = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = message.choices[0]?.message?.content || "";
    const blueprint = parseWorkflowGenerationBlueprint(extractJsonPayload(responseText));

    const availableAccountIdsByPlatform = Object.fromEntries(
      connectionSummary
        .filter((connection) => connection.platform)
        .map((connection) => [connection.platform, connection.id])
    );

    const built = buildWorkflowDefinitionFromBlueprint(blueprint, {
      defaultMasterPrompt: personaPrompt || undefined,
      availableAccountIdsByPlatform,
    });

    await assertWorkflowDefinitionAllowed(auth.userId, built);

    return NextResponse.json({
      name: blueprint.name,
      definition: {
        nodes: built.nodes,
        edges: built.edges,
      },
      warnings: built.warnings,
    });
  } catch (error: unknown) {
    if (isTierAccessError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    const routeError: RouteError =
      error instanceof Error ? (error as RouteError) : new Error("Failed to generate workflow");

    console.error("Workflow generation error:", routeError);
    return NextResponse.json(
      { error: routeError.message || "Failed to generate workflow." },
      { status: routeError.status || 500 }
    );
  }
}
