import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { store } from "~/lib/store";

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/tatadana_session=([^;]+)/);
  if (match && typeof store.destroySession === "function") {
    store.destroySession(match[1]);
  }

  const headers = new Headers();
  headers.append("Set-Cookie", "tatadana_session=; Path=/; Max-Age=0; HttpOnly");
  headers.append("Set-Cookie", "tatadana_session_user=; Path=/; Max-Age=0");
  headers.append("Set-Cookie", "tatadana_impersonate=; Path=/; Max-Age=0");
  return redirect("/login", { headers });
}

export async function action({ request }: ActionFunctionArgs) {
  return loader({ request } as any);
}
