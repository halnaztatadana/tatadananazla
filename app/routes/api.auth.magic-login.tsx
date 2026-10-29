import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { store } from "~/lib/store";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json(
      { ok: false, error: "Token login sekali pakai tidak ditemukan." },
      { status: 400 }
    );
  }

  const result = store.consumeMagicToken(token);
  if (!result.ok || !result.session || !result.user) {
    return json(
      { ok: false, error: result.error || "Token login tidak valid atau sudah kedaluwarsa." },
      { status: 401 }
    );
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `tatadana_session=${result.session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
  );
  headers.append(
    "Set-Cookie",
    `tatadana_session_user=${result.user.user_id}; Path=/; SameSite=Lax; Max-Age=2592000`
  );

  const isAdmin = result.user.role === "admin" || result.user.is_admin === true;
  return redirect(isAdmin ? "/admin" : "/dashboard", { headers });
}
