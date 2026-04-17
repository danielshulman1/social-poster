"use client";
export const dynamic = "force-dynamic";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import {
  BookOpenText,
  Bot,
  CheckCircle2,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  USER_GUIDE_FAQS,
  USER_GUIDE_HIGHLIGHTS,
  USER_GUIDE_SECTIONS,
  USER_GUIDE_SUGGESTED_QUESTIONS,
} from "@/lib/user-guide";

type HelpChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  sourceSections?: Array<{ id: string; title: string }>;
  usedFallback?: boolean;
};

const initialMessages: HelpChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Ask about workflows, persona setup, Google Sheets, approvals, publishing, or troubleshooting. I'll answer from the user guide inside the app.",
  },
];

export default function HelpPage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<HelpChatMessage[]>(initialMessages);
  const [isAsking, setIsAsking] = useState(false);

  const quickStats = useMemo(
    () => [
      {
        title: "What this covers",
        value: `${USER_GUIDE_SECTIONS.length} guide sections`,
        detail: "End-user setup, workflows, persona, Sheets, approvals, and troubleshooting.",
        icon: BookOpenText,
      },
      {
        title: "Fast answers",
        value: `${USER_GUIDE_FAQS.length} common questions`,
        detail: "Use the FAQ when you want a direct answer without reading the full guide.",
        icon: CheckCircle2,
      },
      {
        title: "Live help",
        value: "In-app assistant",
        detail: "Ask product questions in plain language without leaving the dashboard.",
        icon: Bot,
      },
    ],
    []
  );

  const submitQuestion = async (questionOverride?: string) => {
    const question = (questionOverride ?? draft).trim();
    if (!question || isAsking) return;

    const userMessage: HelpChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };

    const nextConversation = [...messages, userMessage];
    setMessages(nextConversation);
    setDraft("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          messages: nextConversation.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || "Failed to get help response");
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: typeof data.answer === "string" ? data.answer : "I could not answer that question yet.",
          sourceSections: Array.isArray(data.sourceSections) ? data.sourceSections : [],
          usedFallback: Boolean(data.usedFallback),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content:
            "I could not answer that right now. Try again in a moment, or open the relevant guide section below for the manual steps.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitQuestion();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitQuestion();
    }
  };

  return (
    <div className="page-shell space-y-8">
      <section className="page-hero">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <span className="page-kicker">User Help</span>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em]">
                User guide and help chat for building, running, and reviewing workflows.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                This help center is for everyday users. It explains how to set up the app, build workflows,
                use personas, connect Google Sheets, choose images, and review posts before publishing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href="#guide">
                  <BookOpenText className="h-4 w-4" />
                  Open Guide
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#assistant">
                  <MessageSquare className="h-4 w-4" />
                  Ask The Assistant
                </a>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[25rem] xl:grid-cols-1">
            {USER_GUIDE_HIGHLIGHTS.slice(0, 2).map((highlight) => (
              <div
                key={highlight}
                className="rounded-[1.7rem] border border-border/75 bg-background/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-foreground">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border/75 bg-background/75 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardDescription>{item.title}</CardDescription>
                <CardTitle className="text-lg">{item.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{item.detail}</CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <div className="space-y-6" id="guide">
          <Tabs defaultValue="guide" className="space-y-5">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="guide">Guide</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="guide" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Browse by topic</CardTitle>
                  <CardDescription>
                    Jump to the area you are working on and use the step-by-step notes to configure it correctly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {USER_GUIDE_SECTIONS.map((section) => (
                    <Badge key={section.id} asChild variant="outline" className="cursor-pointer">
                      <a href={`#${section.id}`}>{section.title}</a>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {USER_GUIDE_SECTIONS.map((section) => (
                <Card key={section.id} id={section.id} className="scroll-mt-24">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary">{section.title}</Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        User workflow
                      </span>
                    </div>
                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                    <CardDescription>{section.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {section.steps.map((step, index) => (
                        <div
                          key={step.title}
                          className="rounded-[1.5rem] border border-border/75 bg-background/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-secondary/28 p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        Practical tips
                      </div>
                      <div className="space-y-2">
                        {section.tips.map((tip) => (
                          <p key={tip} className="text-sm leading-6 text-muted-foreground">
                            {tip}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Common user questions</CardTitle>
                  <CardDescription>
                    Fast answers for the issues users hit most often while setting up and publishing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-1">
                    {USER_GUIDE_FAQS.map((faq, index) => (
                      <AccordionItem
                        key={faq.question}
                        value={`faq-${index}`}
                        className="rounded-[1.3rem] border border-border/75 px-4"
                      >
                        <AccordionTrigger className="text-left text-sm hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-6 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start" id="assistant">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(229,140,98,0.12),rgba(45,127,122,0.09))]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-background/78 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Help Assistant</CardTitle>
                  <CardDescription>
                    Ask questions in plain language. Answers stay grounded in the user guide.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <ScrollArea className="h-[30rem]">
                <div className="space-y-4 p-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border/75 bg-background/78 text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.role === "assistant" && message.sourceSections && message.sourceSections.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.sourceSections.map((section) => (
                              <Badge key={`${message.id}-${section.id}`} variant="outline">
                                {section.title}
                              </Badge>
                            ))}
                            {message.usedFallback && <Badge variant="secondary">Guide fallback</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-[1.5rem] border border-border/75 bg-background/78 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking through your question
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t border-border/70 p-6 pt-5">
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask how to build a workflow, use Google Sheets images, hold posts for approval, or debug a failed run."
                    className="min-h-[7.5rem] rounded-[1.4rem] bg-background/75 px-4 py-3 text-sm leading-6"
                  />
                  <Button type="submit" disabled={isAsking || draft.trim().length === 0} className="w-full">
                    {isAsking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Answering
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" />
                        Ask Question
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested questions</CardTitle>
              <CardDescription>Use one of these if you want to test the assistant quickly.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {USER_GUIDE_SUGGESTED_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal py-2 text-left"
                  onClick={() => submitQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
