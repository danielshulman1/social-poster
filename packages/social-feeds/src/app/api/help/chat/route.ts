export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import {
  buildUserGuidePlainText,
  findRelevantGuideFaqs,
  findRelevantGuideSections,
} from "@/lib/user-guide";

type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

const HELP_MODEL = "gpt-4o-mini";

const sanitizeMessages = (value: unknown): ChatMessageInput[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message): message is ChatMessageInput =>
        !!message &&
        typeof message === "object" &&
        "role" in message &&
        "content" in message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-8);
};

const buildFallbackAnswer = (question: string) => {
  const relevantSections = findRelevantGuideSections(question, 2);
  const relevantFaqs = findRelevantGuideFaqs(question, 2);

  const sectionText = relevantSections
    .map((section) => {
      const nextSteps = section.steps
        .slice(0, 2)
        .map((step) => `- ${step.title}: ${step.detail}`)
        .join("\n");

      return `${section.title}\n${section.summary}\n${nextSteps}`;
    })
    .join("\n\n");

  const faqText = relevantFaqs
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");

  const answerParts = [
    "Here is the closest guidance from the in-app user guide:",
    sectionText,
    faqText ? `Related answers:\n${faqText}` : "",
    "For richer help-chat responses, add or refresh your OpenAI API key in Settings.",
  ].filter(Boolean);

  return {
    answer: answerParts.join("\n\n"),
    sourceSections: relevantSections.map((section) => ({
      id: section.id,
      title: section.title,
    })),
    usedFallback: true,
  };
};

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText("Unauthorized");

  let question = "";

  try {
    const body = await req.json();
    const messages = sanitizeMessages(body?.messages);
    question =
      typeof body?.question === "string" && body.question.trim().length > 0
        ? body.question.trim()
        : messages.filter((message) => message.role === "user").at(-1)?.content || "";

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const relevantSections = findRelevantGuideSections(question, 3);
    const relevantFaqs = findRelevantGuideFaqs(question, 3);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { openaiApiKey: true },
    });

    const apiKey = user?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(buildFallbackAnswer(question));
    }

    const openai = new OpenAI({ apiKey });
    const guideContext = buildUserGuidePlainText();
    const targetedContext = [
      ...relevantSections.map(
        (section) =>
          `${section.title}\n${section.summary}\n${section.steps
            .map((step, index) => `${index + 1}. ${step.title}: ${step.detail}`)
            .join("\n")}\n${section.tips.map((tip) => `Tip: ${tip}`).join("\n")}`
      ),
      ...relevantFaqs.map((faq) => `FAQ\nQ: ${faq.question}\nA: ${faq.answer}`),
    ].join("\n\n");

    const completion = await openai.chat.completions.create({
      model: HELP_MODEL,
      temperature: 0.3,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are the Social Poster user help assistant. Answer only for end users of this app. Use the provided user guide as the source of truth. Be concrete, concise, and task-oriented. If something is not supported by the guide, say so plainly instead of guessing. Do not provide admin-only workflows unless the user explicitly asks, and if they do ask, say that the current guide is for regular users.",
        },
        {
          role: "system",
          content: `Full user guide:\n${guideContext}`,
        },
        {
          role: "system",
          content: `Most relevant guide excerpts for this question:\n${targetedContext}`,
        },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: question,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0]?.message?.content?.trim() || buildFallbackAnswer(question).answer,
      sourceSections: relevantSections.map((section) => ({
        id: section.id,
        title: section.title,
      })),
      usedFallback: false,
    });
  } catch (error) {
    console.error("Error answering help chat question:", error);
    return NextResponse.json(buildFallbackAnswer(question || "general help"));
  }
}
