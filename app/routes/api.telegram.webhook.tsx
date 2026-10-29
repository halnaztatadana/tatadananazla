import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  store,
  parseIndonesianCurrency,
  parseIndonesianTransaction,
  formatRupiah,
  formatWibBotReply,
  type Profile,
} from "~/lib/store";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Secret token check if provided in headers
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (configuredSecret && secretHeader && secretHeader !== configuredSecret) {
    return json({ ok: false, error: "Unauthorized: invalid secret token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const updateId = payload.update_id;
  if (!updateId) {
    return json({ ok: false, error: "Missing update_id" }, { status: 400 });
  }

  // 1. Idempotency Check (telegram_updates)
  if (store.telegramUpdates.has(updateId)) {
    return json({
      ok: true,
      status: "duplicate_ignored",
      message: "Update already processed",
    });
  }

  const msg = payload.message;
  if (!msg) {
    store.telegramUpdates.set(updateId, {
      update_id: updateId,
      processed_at: new Date().toISOString(),
      user_id: null,
      status: "processed",
    });
    return json({ ok: true, status: "processed" });
  }

  const tgUserId = msg.from?.id;
  const chatId = msg.chat?.id;

  // 2. Deep-link pairing: "/start LINK_xxx"
  if (msg.text && msg.text.startsWith("/start LINK_")) {
    const pairingCode = msg.text.trim().split(" ")[1];
    let matchedUser: Profile | null = null;
    for (const p of store.profiles.values()) {
      if (p.telegram_pairing_code === pairingCode) {
        matchedUser = p;
        break;
      }
    }

    if (matchedUser) {
      matchedUser.telegram_user_id = tgUserId;
      matchedUser.telegram_chat_id = chatId;
      matchedUser.telegram_pairing_code = null; // consume token

      store.telegramUpdates.set(updateId, {
        update_id: updateId,
        processed_at: new Date().toISOString(),
        user_id: matchedUser.user_id,
        status: "processed",
      });

      return json({
        ok: true,
        status: "processed",
        replyText: `🎉 Selamat datang di TataDana, ${matchedUser.full_name}! Akun Telegram Anda berhasil terhubung.`,
      });
    } else {
      return json(
        {
          ok: false,
          status: "error",
          errorMessage: "Kode tautan tidak valid atau sudah kadaluarsa.",
        },
        { status: 400 }
      );
    }
  }

  // 3. User lookup by telegram_user_id
  let userProfile: Profile | null = null;
  for (const p of store.profiles.values()) {
    if (p.telegram_user_id === tgUserId) {
      userProfile = p;
      break;
    }
  }

  // Fallback to demo user if testing in development sandbox
  if (!userProfile) {
    userProfile = store.profiles.get("usr_demo_tatadana") || null;
  }

  if (!userProfile) {
    store.telegramUpdates.set(updateId, {
      update_id: updateId,
      processed_at: new Date().toISOString(),
      user_id: null,
      status: "unlinked",
    });
    return json({
      ok: true,
      status: "unlinked",
      replyText:
        "⚠️ Akun Telegram Anda belum ditautkan ke akun TataDana. Silakan tautkan melalui menu Pengaturan di web TataDana.",
    });
  }

  // 4. Handle Slash Commands
  if (msg.text && msg.text.startsWith("/")) {
    const cmd = msg.text.toLowerCase().trim();
    let reply = "";

    if (cmd === "/saldo") {
      const userWallets = Array.from(store.wallets.values()).filter(
        (w) => w.user_id === userProfile!.user_id
      );
      const total = userWallets.reduce((acc, w) => acc + w.balance, 0);
      reply =
        `💼 **RINGKASAN SALDO ANDA**\n` +
        userWallets.map((w) => `• ${w.name}: ${formatRupiah(w.balance)}`).join("\n") +
        `\n\n**Total Saldo:** ${formatRupiah(total)}`;
    } else if (cmd === "/budget") {
      const now = new Date();
      const userBudgets = Array.from(store.budgets.values()).filter(
        (b) =>
          b.user_id === userProfile!.user_id &&
          b.period_month === now.getMonth() + 1 &&
          b.period_year === now.getFullYear()
      );
      if (userBudgets.length === 0) {
        reply = "ℹ️ Anda belum menyetel budget bulan ini. Setel melalui menu Budget di web TataDana.";
      } else {
        reply =
          `📊 **STATUS BUDGET BULAN INI**\n` +
          userBudgets
            .map((b) => {
              const cat = store.categories.get(b.category_id);
              const pct = Math.round((b.spent_amount / b.monthly_amount) * 100);
              return `${cat?.name || "Kategori"}: [${b.spent_amount}/${b.monthly_amount}] ${pct}% (${formatRupiah(
                b.spent_amount
              )} / ${formatRupiah(b.monthly_amount)})`;
            })
            .join("\n");
      }
    } else if (cmd === "/bantuan") {
      reply =
        "📖 **Panduan TataDana Bot:**\n" +
        "• Kirim teks: 'kopi 25rb gopay' / 'gajian 5jt bca'\n" +
        "• Kirim voice note pengeluaran\n" +
        "• Kirim foto struk belanja (Pro)\n" +
        "• Commands: /saldo, /budget, /hari ini, /bulan ini, /bantuan";
    } else {
      reply = `Command ${cmd} diterima. Ketik /bantuan untuk daftar perintah.`;
    }

    store.telegramUpdates.set(updateId, {
      update_id: updateId,
      processed_at: new Date().toISOString(),
      user_id: userProfile.user_id,
      status: "processed",
    });

    return json({ ok: true, status: "processed", replyText: reply });
  }

  // 5. Handle Text Financial Transaction
  if (msg.text) {
    const parsed = parseIndonesianTransaction(msg.text);
    if (!parsed) {
      store.telegramUpdates.set(updateId, {
        update_id: updateId,
        processed_at: new Date().toISOString(),
        user_id: userProfile.user_id,
        status: "error",
      });
      return json(
        {
          ok: false,
          status: "error",
          errorMessage: 'Tidak dapat mendeteksi nominal transaksi. Contoh: "kopi 25rb"',
        },
        { status: 400 }
      );
    }

    // Wallets & Category
    const userWallets = Array.from(store.wallets.values()).filter(
      (w) => w.user_id === userProfile!.user_id
    );
    let targetWallet = userWallets.find(
      (w) => parsed.walletName && w.name.toUpperCase() === parsed.walletName
    );
    if (!targetWallet) {
      targetWallet = userWallets.find((w) => w.is_telegram_default) || userWallets[0];
    }

    let matchedCat = Array.from(store.categories.values()).find(
      (c) =>
        c.user_id === userProfile!.user_id &&
        c.name.toLowerCase() === parsed.kategori.toLowerCase()
    );
    if (!matchedCat) {
      matchedCat = Array.from(store.categories.values()).find(
        (c) => c.user_id === userProfile!.user_id
      )!;
    }

    try {
      const createdTx = store.createTransaction({
        user_id: userProfile.user_id,
        wallet_id: targetWallet.id,
        category_id: matchedCat ? matchedCat.id : "cat_default",
        type: parsed.jenis,
        amount: parsed.nominal,
        date_wib: new Date().toISOString(),
        notes: parsed.catatan,
        source: "telegram_text",
        has_items: false,
      });

      // Find budget for report
      const budget = Array.from(store.budgets.values()).find(
        (b) => b.user_id === userProfile!.user_id && b.category_id === matchedCat?.id
      );

      const reply = formatWibBotReply({
        jenis: parsed.jenis,
        nominal: parsed.nominal,
        kategori: `${matchedCat?.emoji || "📝"} ${matchedCat?.name || parsed.kategori}`,
        catatan: parsed.catatan,
        walletName: targetWallet.name,
        walletBalance: targetWallet.balance,
        dateWib: new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
        budget: budget
          ? { monthlyAmount: budget.monthly_amount, spentAmount: budget.spent_amount }
          : null,
      });

      store.telegramUpdates.set(updateId, {
        update_id: updateId,
        processed_at: new Date().toISOString(),
        user_id: userProfile.user_id,
        status: "processed",
      });

      return json({
        ok: true,
        status: "processed",
        replyText: reply,
        transactionId: createdTx.id,
      });
    } catch (err: any) {
      if (err.message && err.message.includes("QUOTA_EXCEEDED")) {
        store.telegramUpdates.set(updateId, {
          update_id: updateId,
          processed_at: new Date().toISOString(),
          user_id: userProfile.user_id,
          status: "quota_exceeded",
        });
        return json({
          ok: false,
          status: "quota_exceeded",
          replyText:
            "⚠️ Kuota transaksi Starter (50/bulan) telah habis. Upgrade ke TataDana Pro untuk transaksi unlimited!",
        });
      }
      return json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  // 6. Handle Photo Receipt OCR (Pro tier only)
  if (msg.photo && msg.photo.length > 0) {
    if (userProfile.plan !== "pro") {
      return json({
        ok: false,
        status: "error",
        replyText:
          "🔒 Fitur scan struk otomatis hanya tersedia untuk pengguna TataDana Pro. Silakan upgrade paket Anda.",
      });
    }

    const userWallets = Array.from(store.wallets.values()).filter(
      (w) => w.user_id === userProfile!.user_id
    );
    const defaultWallet = userWallets.find((w) => w.is_telegram_default) || userWallets[0];
    const cat =
      Array.from(store.categories.values()).find(
        (c) => c.user_id === userProfile!.user_id && c.name === "Belanja"
      ) || Array.from(store.categories.values())[0];

    // Mock OCR item extraction
    const items = [
      { name: "Susu UHT 1L", amount: 22000 },
      { name: "Roti Gandum", amount: 18000 },
      { name: "Telur Ayam 1kg", amount: 32000 },
    ];
    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);

    const tx = store.createTransaction({
      user_id: userProfile.user_id,
      wallet_id: defaultWallet.id,
      category_id: cat.id,
      type: "expense",
      amount: totalAmount,
      date_wib: new Date().toISOString(),
      notes: "Belanja Supermarket (OCR Struk)",
      source: "telegram_ocr",
      receipt_url: "https://supabase.tatadana.local/storage/v1/receipts/struk_01.jpg",
      has_items: true,
    });

    items.forEach((item, idx) => {
      const itemId = `item_${tx.id}_${idx}`;
      store.transactionItems.set(itemId, {
        id: itemId,
        transaction_id: tx.id,
        item_name: item.name,
        amount: item.amount,
        time_wib: new Date().toISOString(),
      });
    });

    const reply =
      `🧾 **STRUK BELANJA DITERIMA (PRO OCR)**\n` +
      `• Merchant: Supermarket\n` +
      `• Total: **${formatRupiah(totalAmount)}** (${items.length} item)\n` +
      items.map((i) => `  - ${i.name}: ${formatRupiah(i.amount)}`).join("\n") +
      `\n• Dompet: ${defaultWallet.name} (Sisa: ${formatRupiah(defaultWallet.balance)})`;

    store.telegramUpdates.set(updateId, {
      update_id: updateId,
      processed_at: new Date().toISOString(),
      user_id: userProfile.user_id,
      status: "processed",
    });

    return json({
      ok: true,
      status: "processed",
      replyText: reply,
      transactionId: tx.id,
    });
  }

  // 7. Handle Voice Note
  if (msg.voice) {
    if (msg.voice.duration > 60) {
      return json({
        ok: false,
        status: "error",
        replyText:
          "⚠️ Durasi voice note maksimal 60 detik. Mohon kirim rekaman yang lebih singkat.",
      });
    }

    const transcript = "Beli bensin pertamax 50 ribu";
    const parsed = parseIndonesianTransaction(transcript)!;
    const userWallets = Array.from(store.wallets.values()).filter(
      (w) => w.user_id === userProfile!.user_id
    );
    const defaultWallet = userWallets.find((w) => w.is_telegram_default) || userWallets[0];
    const cat =
      Array.from(store.categories.values()).find(
        (c) => c.user_id === userProfile!.user_id && c.name === "Transportasi"
      ) || Array.from(store.categories.values())[0];

    const tx = store.createTransaction({
      user_id: userProfile.user_id,
      wallet_id: defaultWallet.id,
      category_id: cat.id,
      type: "expense",
      amount: parsed.nominal,
      date_wib: new Date().toISOString(),
      notes: parsed.catatan,
      source: "telegram_voice",
      has_items: false,
    });

    const reply = formatWibBotReply({
      jenis: "expense",
      nominal: parsed.nominal,
      kategori: `${cat.emoji} ${cat.name}`,
      catatan: parsed.catatan,
      walletName: defaultWallet.name,
      walletBalance: defaultWallet.balance,
      dateWib: new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
      transcript,
    });

    store.telegramUpdates.set(updateId, {
      update_id: updateId,
      processed_at: new Date().toISOString(),
      user_id: userProfile.user_id,
      status: "processed",
    });

    return json({
      ok: true,
      status: "processed",
      replyText: reply,
      transactionId: tx.id,
    });
  }

  return json({ ok: true, status: "processed" });
}
