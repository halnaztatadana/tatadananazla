import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Cpu, CheckCircle2, AlertCircle, ShieldCheck, Zap } from "lucide-react";
import { store, type AiProvider } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const providers = Array.from(store.aiProviders.values()).sort((a, b) => a.priority - b.priority);
  return json({ providers });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionContext(request);
  if (!session.isAdmin) throw new Response("403 Forbidden", { status: 403 });

  const formData = await request.formData();
  const providerId = String(formData.get("providerId"));
  const intent = formData.get("intent");

  const p = store.aiProviders.get(providerId);
  if (!p) return json({ error: "Provider tidak ditemukan" }, { status: 404 });

  if (intent === "toggle_active") {
    p.is_active = !p.is_active;
    return json({ success: true, is_active: p.is_active });
  }

  if (intent === "set_mode") {
    const mode = String(formData.get("mode")) as "single" | "parallel" | "failover";
    p.mode = mode;
    return json({ success: true, mode });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export default function AdminProvidersRoute() {
  const { providers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-rose-600" />
          Konfigurasi AI Provider & Failover
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola mesin AI multimodal (Gemini, OpenAI, DeepSeek), kunci API terenkripsi, dan mode failover otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((p) => {
          const isGoogle = p.provider_name === "gemini";
          const isOpenAI = p.provider_name === "openai";

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                p.is_active ? "border-slate-300 ring-1 ring-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      isGoogle
                        ? "bg-amber-100 text-amber-800"
                        : isOpenAI
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    Prioritas #{p.priority}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {p.is_active ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Nonaktif
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 capitalize mb-1">
                  {p.provider_name}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {isGoogle
                    ? "Gemini 1.5/2.0 Flash (Teks NLP + Vision Struk + Voice Transcription)"
                    : isOpenAI
                    ? "GPT-4o Mini + Whisper Audio (Failover Provider)"
                    : "DeepSeek-V3 Chat (High-efficiency failover)"}
                </p>

                <div className="space-y-2 mb-6 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Enkripsi:</span>
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> AES-256
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Key Prefix:</span>
                    <span className="text-slate-700 font-bold">{p.api_key_encrypted.substring(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Mode:</span>
                    <span className="text-orange-600 font-bold uppercase">{p.mode}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <fetcher.Form method="post" className="w-full">
                  <input type="hidden" name="providerId" value={p.id} />
                  <input type="hidden" name="intent" value="toggle_active" />
                  <button
                    type="submit"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      p.is_active
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    }`}
                  >
                    {p.is_active ? "Nonaktifkan" : "Aktifkan Provider"}
                  </button>
                </fetcher.Form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
