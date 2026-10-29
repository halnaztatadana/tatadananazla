import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);

  if (!session.isAuthenticated || !session.user) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const status = session.user.verification_status || (session.isAdmin ? "approved" : "pending");
  const approved = status === "approved" || session.isAdmin;

  return json({
    ok: true,
    userId: session.user.user_id,
    status,
    approved,
    role: session.user.role || (session.isAdmin ? "admin" : "user"),
  });
}
