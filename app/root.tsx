import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram" },
    {
      name: "description",
      content:
        "SaaS Personal Finance Indonesia dengan integrasi Telegram Bot & AI Multimodal untuk pencatatan transaksi otomatis, scan struk belanja, dan laporan keuangan komprehensif.",
    },
    { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    { name: "theme-color", content: "#F97316" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || "https://sandbox.supabase.co",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || "sandbox_anon_key",
    },
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="id" className="h-full bg-slate-50 antialiased">
      <head>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body className="h-full font-sans text-slate-800 bg-slate-50">
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)};`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
