import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { action as webhookAction } from "./api.telegram.webhook";
import { handleSavingPlacesChat, store } from "~/lib/store";
import { getSessionContext } from "~/lib/supabase/server";

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const session = await getSessionContext(request);
  const user = session.user || store.profiles.get("usr_demo_tatadana") || null;

  const content = (body.text || body.content || "").trim();
  const savingAdvice = handleSavingPlacesChat(content, user);
  if (savingAdvice) {
    return json({
      ok: true,
      status: "processed",
      replyText: savingAdvice.replyText,
      options: savingAdvice.options,
      preferenceTitle: savingAdvice.preferenceTitle || null,
      instrument: savingAdvice.instrument || null,
    });
  }

  const updateId = Date.now();
  let fakeTelegramMessage: any = {
    message_id: Math.floor(Math.random() * 100000),
    from: {
      id: 99887766,
      is_bot: false,
      first_name: "Demo Tester",
      username: "demotester",
    },
    chat: {
      id: 99887766,
      type: "private",
    },
    date: Math.floor(Date.now() / 1000),
  };

  if (body.type === "photo") {
    fakeTelegramMessage.photo = [{ file_id: "photo_test_123", file_size: 102400 }];
  } else if (body.type === "voice") {
    fakeTelegramMessage.voice = { file_id: "voice_test_123", duration: body.duration || 10 };
  } else {
    fakeTelegramMessage.text = body.text || "kopi 25rb";
  }

  const simulatedPayload = {
    update_id: updateId,
    message: fakeTelegramMessage,
  };

  // Construct fake request to webhookAction
  const fakeRequest = new Request("http://localhost:3000/api/telegram/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET || "tatadana-secret",
    },
    body: JSON.stringify(simulatedPayload),
  });

  return webhookAction({ request: fakeRequest, params: {}, context: {} });
}
