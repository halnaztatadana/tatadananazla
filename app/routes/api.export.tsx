import type { LoaderFunctionArgs } from "@remix-run/node";
import { generateExportReport } from "~/lib/export.server";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAuthenticated || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized: Harap login terlebih dahulu" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = session.user.user_id;

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") as "pdf" | "xlsx") || "pdf";
  const period = url.searchParams.get("period") || "2026-10";

  const result = generateExportReport({
    userId,
    format,
    period,
  });

  return new Response(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-cache",
    },
  });
}
