export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { getApiAuthContext, unauthorizedText } from "@/lib/apiAuth";
import { MAX_REFERENCE_DOCUMENTS } from "@/lib/persona-reference-documents";
import { extractPersonaReferenceDocument } from "@/lib/persona-reference-documents.server";

function isFileLike(value: FormDataEntryValue): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value;
}

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText("Unauthorized");

  try {
    const formData = await req.formData();
    const files = formData.getAll("files").filter(isFileLike);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required." },
        { status: 400 }
      );
    }

    if (files.length > MAX_REFERENCE_DOCUMENTS) {
      return NextResponse.json(
        {
          error: `You can upload up to ${MAX_REFERENCE_DOCUMENTS} reference files at a time.`,
        },
        { status: 400 }
      );
    }

    const documents: Awaited<ReturnType<typeof extractPersonaReferenceDocument>>[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const document = await extractPersonaReferenceDocument(file);
        documents.push(document);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `${file.name}: failed to process file.`;
        errors.push(message);
      }
    }

    if (documents.length === 0) {
      return NextResponse.json(
        {
          error: "None of the selected files could be processed.",
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      documents,
      errors,
    });
  } catch (error) {
    console.error("Error extracting persona reference files:", error);
    return NextResponse.json(
      { error: "Failed to process uploaded reference files." },
      { status: 500 }
    );
  }
}
