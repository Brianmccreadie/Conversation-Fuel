import { NextResponse, type NextRequest } from "next/server";
import { runIngest } from "@/lib/ingest";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await runIngest();
  const added = results.reduce((n, r) => n + r.added, 0);
  const errors = results.filter((r) => r.error).length;
  return NextResponse.json({ sources: results.length, added, errors, results });
}
