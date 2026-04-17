export const REFERENCE_DOCUMENT_ACCEPT = ".txt,.md,.pdf,.docx";
export const MAX_REFERENCE_DOCUMENTS = 5;
export const MAX_REFERENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_EXTRACTED_CHARS_PER_REFERENCE_DOCUMENT = 12000;
export const MAX_REFERENCE_DOCUMENT_CHARS_FOR_PROMPT = 24000;

export const SUPPORTED_REFERENCE_DOCUMENT_EXTENSIONS = [
  "txt",
  "md",
  "pdf",
  "docx",
] as const;

export type SupportedReferenceDocumentExtension =
  (typeof SUPPORTED_REFERENCE_DOCUMENT_EXTENSIONS)[number];

export type ReferenceDocumentKind =
  | "brand-guidelines"
  | "master-prompt"
  | "reference";

export interface PersonaReferenceDocument {
  name: string;
  fileType: SupportedReferenceDocumentExtension;
  kind: ReferenceDocumentKind;
  content: string;
  excerpt: string;
  characterCount: number;
  truncated: boolean;
}

export const REFERENCE_DOCUMENT_KIND_OPTIONS: Array<{
  value: ReferenceDocumentKind;
  label: string;
  helper: string;
}> = [
  {
    value: "brand-guidelines",
    label: "Brand Guidelines",
    helper: "Tone, positioning, audience, and brand rules.",
  },
  {
    value: "master-prompt",
    label: "Master Prompt",
    helper: "Core prompt or instruction set to mirror.",
  },
  {
    value: "reference",
    label: "General Reference",
    helper: "Other supporting material for voice and messaging.",
  },
];

const REFERENCE_KIND_LABELS: Record<ReferenceDocumentKind, string> = {
  "brand-guidelines": "Brand Guidelines",
  "master-prompt": "Master Prompt",
  reference: "Reference",
};

export function getReferenceDocumentExtension(
  fileName: string
): SupportedReferenceDocumentExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;

  return SUPPORTED_REFERENCE_DOCUMENT_EXTENSIONS.includes(
    extension as SupportedReferenceDocumentExtension
  )
    ? (extension as SupportedReferenceDocumentExtension)
    : null;
}

export function inferReferenceDocumentKind(
  fileName: string
): ReferenceDocumentKind {
  const lowerFileName = fileName.toLowerCase();

  if (
    lowerFileName.includes("brand") ||
    lowerFileName.includes("guideline") ||
    lowerFileName.includes("style guide")
  ) {
    return "brand-guidelines";
  }

  if (lowerFileName.includes("prompt")) {
    return "master-prompt";
  }

  return "reference";
}

export function isReferenceDocumentKind(
  value: string
): value is ReferenceDocumentKind {
  return REFERENCE_DOCUMENT_KIND_OPTIONS.some((option) => option.value === value);
}

export function getReferenceDocumentKindLabel(kind: ReferenceDocumentKind) {
  return REFERENCE_KIND_LABELS[kind];
}

export function normalizeReferenceDocumentText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncateReferenceDocumentText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return { text: value, truncated: false };
  }

  return {
    text: value.slice(0, maxChars).trimEnd(),
    truncated: true,
  };
}

export function buildReferenceDocumentExcerpt(value: string) {
  return truncateReferenceDocumentText(value.replace(/\s+/g, " "), 180).text;
}

export function createPersonaReferenceDocument(input: {
  name: string;
  fileType: SupportedReferenceDocumentExtension;
  kind: ReferenceDocumentKind;
  content: string;
  characterCount?: number;
  truncated?: boolean;
}): PersonaReferenceDocument {
  const normalizedContent = normalizeReferenceDocumentText(input.content);

  return {
    name: input.name,
    fileType: input.fileType,
    kind: input.kind,
    content: normalizedContent,
    excerpt: buildReferenceDocumentExcerpt(normalizedContent),
    characterCount: input.characterCount ?? normalizedContent.length,
    truncated: input.truncated ?? false,
  };
}

export function sanitizeReferenceDocuments(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as PersonaReferenceDocument[];
  }

  return input
    .slice(0, MAX_REFERENCE_DOCUMENTS)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const rawName = "name" in item && typeof item.name === "string" ? item.name : "";
      const rawFileType =
        "fileType" in item && typeof item.fileType === "string" ? item.fileType : "";
      const rawKind = "kind" in item && typeof item.kind === "string" ? item.kind : "";
      const rawContent =
        "content" in item && typeof item.content === "string" ? item.content : "";
      const rawCharacterCount =
        "characterCount" in item && typeof item.characterCount === "number"
          ? item.characterCount
          : undefined;
      const rawTruncated =
        "truncated" in item && typeof item.truncated === "boolean"
          ? item.truncated
          : undefined;

      const name = rawName.trim();
      const fileType =
        getReferenceDocumentExtension(rawName) ??
        (SUPPORTED_REFERENCE_DOCUMENT_EXTENSIONS.includes(
          rawFileType as SupportedReferenceDocumentExtension
        )
          ? (rawFileType as SupportedReferenceDocumentExtension)
          : null);
      const kind = isReferenceDocumentKind(rawKind)
        ? rawKind
        : inferReferenceDocumentKind(name || "reference");
      const content = normalizeReferenceDocumentText(rawContent);

      if (!name || !fileType || !content) {
        return null;
      }

      return createPersonaReferenceDocument({
        name,
        fileType,
        kind,
        content,
        characterCount: rawCharacterCount,
        truncated: rawTruncated,
      });
    })
    .filter((item): item is PersonaReferenceDocument => item !== null);
}

export function clampReferenceDocumentsForPrompt(
  documents: PersonaReferenceDocument[]
) {
  let remainingChars = MAX_REFERENCE_DOCUMENT_CHARS_FOR_PROMPT;

  return documents
    .slice(0, MAX_REFERENCE_DOCUMENTS)
    .map((document) => {
      if (remainingChars <= 0) {
        return null;
      }

      const { text, truncated } = truncateReferenceDocumentText(
        document.content,
        remainingChars
      );

      remainingChars -= text.length;

      return createPersonaReferenceDocument({
        ...document,
        content: text,
        truncated: document.truncated || truncated,
      });
    })
    .filter((item): item is PersonaReferenceDocument => item !== null);
}

export function buildReferenceDocumentMetadata(
  documents: PersonaReferenceDocument[]
) {
  return documents.map((document) => ({
    name: document.name,
    fileType: document.fileType,
    kind: document.kind,
    kindLabel: getReferenceDocumentKindLabel(document.kind),
    characterCount: document.characterCount,
    truncated: document.truncated,
  }));
}
