const TRIGGER_PLACEHOLDER_MESSAGES = new Set([
  "Manual trigger fired.",
  "Schedule trigger fired.",
]);

type StructuredArticlePrompt = {
  searchQuery?: string;
  sourceUrl?: string;
  title?: string;
  description?: string;
  content?: string;
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const truncateAtWord = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped.slice(0, maxLength)).trim()}...`;
};

const extractPromptField = (text: string, field: string) => {
  const match = text.match(new RegExp(`(?:^|\\n)${field}:\\s*(.*)`, "i"));
  return match?.[1]?.trim() || "";
};

const parseStructuredArticlePrompt = (text: string): StructuredArticlePrompt | null => {
  const contentMatch = text.match(/(?:^|\n)CONTENT:\s*([\s\S]*)$/i);
  const sourceUrl = extractPromptField(text, "SOURCE_URL");
  const title = extractPromptField(text, "TITLE");
  const description = extractPromptField(text, "DESCRIPTION");
  const searchQuery = extractPromptField(text, "SEARCH_QUERY");
  const content = contentMatch?.[1]?.trim() || "";

  const hasStructuredFields =
    !!contentMatch ||
    text.includes("SOURCE_URL:") ||
    text.includes("TITLE:") ||
    text.includes("DESCRIPTION:");

  if (!hasStructuredFields) return null;

  return {
    searchQuery: searchQuery || undefined,
    sourceUrl: sourceUrl || undefined,
    title: title || undefined,
    description: description || undefined,
    content: content || undefined,
  };
};

const buildCaptionFromArticlePrompt = (prompt: StructuredArticlePrompt) => {
  const title = normalizeWhitespace(prompt.title || "");
  const description = normalizeWhitespace(
    prompt.description && prompt.description !== "N/A" ? prompt.description : "",
  );
  const content = normalizeWhitespace(prompt.content || "");
  const sourceUrl = normalizeWhitespace(prompt.sourceUrl || "");

  let summary = description || content;
  if (title && summary.toLowerCase() === title.toLowerCase()) {
    summary = content && content.toLowerCase() !== title.toLowerCase() ? content : "";
  }

  const parts: string[] = [];
  if (title) parts.push(title);
  if (summary) parts.push(truncateAtWord(summary, 280));
  if (sourceUrl) parts.push(`Read more: ${sourceUrl}`);

  return parts.join("\n\n").trim();
};

export const preparePublishableContent = (rawContent: unknown) => {
  if (typeof rawContent !== "string") return "";

  const trimmed = rawContent.trim();
  if (!trimmed || TRIGGER_PLACEHOLDER_MESSAGES.has(trimmed)) {
    return "";
  }

  const articlePrompt = parseStructuredArticlePrompt(trimmed);
  if (articlePrompt) {
    return buildCaptionFromArticlePrompt(articlePrompt);
  }

  return trimmed;
};

export const isTriggerPlaceholderContent = (rawContent: unknown) =>
  typeof rawContent === "string" && TRIGGER_PLACEHOLDER_MESSAGES.has(rawContent.trim());
