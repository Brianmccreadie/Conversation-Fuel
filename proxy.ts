import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (e) {
    // Surface a readable diagnosis instead of a blank "Internal Server Error".
    const message = e instanceof Error ? e.message : String(e);
    return new NextResponse(
      `Auth proxy error: ${message}\n\n` +
        `Usual causes: Supabase env vars malformed (stray whitespace or ` +
        `quotes), or the Supabase project is paused. Check Vercel → ` +
        `Observability → Logs for the full stack trace.`,
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
}

export const config = {
  matcher: [
    // Everything except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
