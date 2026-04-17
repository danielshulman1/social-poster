export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import {
  buildGoogleSheetsTemplateCsv,
  GOOGLE_SHEETS_TEMPLATE_FILENAME,
} from "@/lib/google-sheets-template";

export async function GET() {
  const csv = buildGoogleSheetsTemplateCsv();

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${GOOGLE_SHEETS_TEMPLATE_FILENAME}"`,
      "Cache-Control": "no-store",
    },
  });
}
