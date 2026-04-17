import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import {
  MAX_EXTRACTED_CHARS_PER_REFERENCE_DOCUMENT,
  MAX_REFERENCE_FILE_SIZE_BYTES,
  type PersonaReferenceDocument,
  createPersonaReferenceDocument,
  getReferenceDocumentExtension,
  inferReferenceDocumentKind,
  normalizeReferenceDocumentText,
  truncateReferenceDocumentText,
} from "@/lib/persona-reference-documents";

export async function extractPersonaReferenceDocument(
  file: File
): Promise<PersonaReferenceDocument> {
  const fileType = getReferenceDocumentExtension(file.name);

  if (!fileType) {
    throw new Error(
      `${file.name}: unsupported file type. Use .txt, .md, .pdf, or .docx.`
    );
  }

  if (file.size > MAX_REFERENCE_FILE_SIZE_BYTES) {
    throw new Error(
      `${file.name}: file is too large. Maximum size is ${Math.round(
        MAX_REFERENCE_FILE_SIZE_BYTES / (1024 * 1024)
      )}MB.`
    );
  }

  let extractedText = "";

  if (fileType === "txt" || fileType === "md") {
    extractedText = await file.text();
  } else {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileType === "pdf") {
      const parser = new PDFParse({ data: buffer });

      try {
        const result = await parser.getText();
        extractedText = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }
  }

  const normalizedText = normalizeReferenceDocumentText(extractedText);

  if (normalizedText.length < 20) {
    throw new Error(
      `${file.name}: not enough readable text was extracted from the document.`
    );
  }

  const { text, truncated } = truncateReferenceDocumentText(
    normalizedText,
    MAX_EXTRACTED_CHARS_PER_REFERENCE_DOCUMENT
  );

  return createPersonaReferenceDocument({
    name: file.name,
    fileType,
    kind: inferReferenceDocumentKind(file.name),
    content: text,
    characterCount: normalizedText.length,
    truncated,
  });
}
