import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runQualityAudit } from "@/lib/blog-quality-audit";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await runQualityAudit();
  return NextResponse.json(report);
}
