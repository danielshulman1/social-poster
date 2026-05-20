import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseDataImageUrl = (value: string) => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
};

export async function GET(
  _req: Request,
  props: { params: Promise<{ executionId: string; nodeId: string }> },
) {
  const params = await props.params;

  const step = await prisma.executionStep.findFirst({
    where: {
      executionId: params.executionId,
      nodeId: params.nodeId,
      nodeType: "image-generation",
      status: "completed",
    },
    select: {
      output: true,
    },
  });

  if (!step?.output || typeof step.output !== "string") {
    return new NextResponse("Image not found", { status: 404 });
  }

  const image = parseDataImageUrl(step.output);
  if (!image) {
    return new NextResponse("Image not available", { status: 404 });
  }

  return new NextResponse(image.bytes, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(image.bytes.length),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
