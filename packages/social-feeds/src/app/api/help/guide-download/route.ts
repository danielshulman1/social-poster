export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { USER_GUIDE_DOWNLOAD_FILENAME, USER_GUIDE_DRIVE_DOWNLOAD_URL, USER_GUIDE_DRIVE_VIEW_URL } from "@/lib/user-guide";

export async function GET() {
  try {
    const response = await fetch(USER_GUIDE_DRIVE_DOWNLOAD_URL, {
      redirect: "follow",
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    if (!response.ok || contentType.includes("text/html")) {
      return NextResponse.redirect(USER_GUIDE_DRIVE_VIEW_URL);
    }

    const file = await response.arrayBuffer();
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${USER_GUIDE_DOWNLOAD_FILENAME}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.redirect(USER_GUIDE_DRIVE_VIEW_URL);
  }
}
