/**
 * TataDana Unified Data Store & Financial Engine
 * Handles Indonesian NLP Parsing, Triggers, RLS, and Mock Supabase Sandbox
 */

export interface Profile {
  id: string;
  user_id: string;
  username?: string | null;
  email?: string | null;
  phone_number: string | null;
  phone_verified: boolean;
  full_name: string;
  avatar_url: string | null;
  default_currency: string;
  plan: 'starter' | 'pro';
  role: 'user' | 'superadmin' | 'admin';
  is_admin?: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  magic_login_token?: string | null;
  magic_login_expires?: string | null;
  saving_preference?: string | null;
  telegram_user_id: number | null;
  telegram_chat_id: number | null;
  telegram_pairing_code?: string | null;
  daily_reminder_enabled: boolean;
  daily_reminder_time_1: string;
  daily_reminder_time_2: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  token: string;
  user_id: string;
  email: string | null;
  role: 'user' | 'superadmin' | 'admin';
  is_admin: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  expires_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'investment';
  balance: number;
  is_telegram_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string | null; // null for system template
  name: string;
  type: 'expense' | 'income' | 'transfer';
  emoji: string;
  color: string;
  is_ai_recommended: boolean;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_amount: number;
  spent_amount: number;
  period_month: number;
  period_year: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id?: string | null; // For transfer
  category_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date_wib: string;
  notes: string;
  source: 'telegram_text' | 'telegram_ocr' | 'telegram_voice' | 'web' | 'simulator';
  receipt_url?: string | null;
  has_items: boolean;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_name: string;
  amount: number;
  category_id?: string;
  time_wib: string;
}

export interface AiProvider {
  id: string;
  provider_name: 'gemini' | 'openai' | 'deepseek';
  api_key_encrypted: string;
  is_active: boolean;
  mode: 'single' | 'parallel' | 'failover';
  priority: number;
}

export interface AiLog {
  id: string;
  user_id: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  input_type: 'text' | 'vision_ocr' | 'audio_transcript';
  latency_ms: number;
  status: 'success' | 'error' | 'timeout';
  error_message?: string;
  created_at: string;
}

export interface TelegramUpdate {
  update_id: number;
  processed_at: string;
  user_id: string | null;
  status: 'processed' | 'duplicate_ignored' | 'unlinked' | 'quota_exceeded' | 'error';
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  plan: 'pro';
  amount: number;
  payment_type: 'midtrans_snap' | 'manual_transfer';
  midtrans_order_id: string;
  status: 'pending' | 'settlement' | 'approved' | 'rejected' | 'expire';
  proof_url?: string;
  approved_by?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'xlsx';
  period: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  reason: string;
  created_at: string;
}

// 14 Default Indonesian Categories
export const SEED_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
  { name: 'Makanan & Minuman', type: 'expense', emoji: '🍔', color: '#F97316', is_ai_recommended: true },
  { name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#3B82F6', is_ai_recommended: true },
  { name: 'Belanja', type: 'expense', emoji: '🛍️', color: '#EC4899', is_ai_recommended: true },
  { name: 'Tagihan & Utilitas', type: 'expense', emoji: '⚡', color: '#EAB308', is_ai_recommended: true },
  { name: 'Hiburan', type: 'expense', emoji: '🎮', color: '#8B5CF6', is_ai_recommended: true },
  { name: 'Kesehatan', type: 'expense', emoji: '💊', color: '#10B981', is_ai_recommended: true },
  { name: 'Pendidikan', type: 'expense', emoji: '🎓', color: '#06B6D4', is_ai_recommended: true },
  { name: 'Investasi', type: 'expense', emoji: '📈', color: '#14B8A6', is_ai_recommended: true },
  { name: 'Gaji', type: 'income', emoji: '💼', color: '#22C55E', is_ai_recommended: true },
  { name: 'Bisnis', type: 'income', emoji: '🏢', color: '#3B82F6', is_ai_recommended: true },
  { name: 'Hadiah', type: 'income', emoji: '🎁', color: '#F43F5E', is_ai_recommended: true },
  { name: 'Investasi Profit', type: 'income', emoji: '📊', color: '#10B981', is_ai_recommended: true },
  { name: 'Transfer Keluar', type: 'transfer', emoji: '🔄', color: '#64748B', is_ai_recommended: false },
  { name: 'Lain-lain', type: 'expense', emoji: '📦', color: '#94A3B8', is_ai_recommended: false },
];

/**
 * Indonesian Currency parser handling "15rb", "1.5jt", "500k", "Rp 50.000", etc.
 */
export function parseIndonesianCurrency(raw: string): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim().toLowerCase();

  // Negative check
  if (clean.startsWith('-')) {
    return null;
  }

  // 1. "1.5jt", "1,5jt", "2jt", "10 juta"
  const jtMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:jt|juta)$/);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  // 2. "15rb", "15.5rb", "500ribu"
  const rbMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)$/);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  // 3. "500k", "25.5k"
  const kMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*k$/);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  // 4. "rp 50.000", "rp50000", "50.000", "50000"
  const stdMatch = clean.match(/^(?:rp\s*)?(\d{1,3}(?:\.\d{3})*|\d+)$/);
  if (stdMatch) {
    const numStr = stdMatch[1].replace(/\./g, '');
    const num = parseInt(numStr, 10);
    return isNaN(num) ? null : num;
  }

  return null;
}

/**
 * Natural language Indonesian text parser for financial transaction commands
 */
export function parseIndonesianTransaction(input: string): {
  jenis: 'expense' | 'income' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  walletName?: string;
  toWalletName?: string;
} | null {
  if (!input || !input.trim()) return null;
  const text = input.trim();

  // Transfer pattern: "transfer 500rb bca ke gopay"
  const transferMatch = text.match(/transfer\s+([0-9.,\s]+(?:jt|juta|rb|ribu|k|rp)?)\s+([a-zA-Z0-9]+)\s+ke\s+([a-zA-Z0-9]+)/i);
  if (transferMatch) {
    const nominal = parseIndonesianCurrency(transferMatch[1].trim());
    if (nominal && nominal > 0) {
      return {
        jenis: 'transfer',
        nominal,
        kategori: 'Transfer Keluar',
        catatan: `Transfer dari ${transferMatch[2]} ke ${transferMatch[3]}`,
        walletName: transferMatch[2].toUpperCase(),
        toWalletName: transferMatch[3].toUpperCase(),
      };
    }
  }

  // Income patterns: "gajian 12.5jt", "dapat bonus 500rb", "terima hadiah 100k"
  const incomeKeywords = ['gajian', 'gaji', 'bonus', 'hadiah', 'dapat', 'terima', 'income', 'masuk'];
  const isIncome = incomeKeywords.some((kw) => text.toLowerCase().includes(kw));

  // Extract currency token
  const words = text.split(/\s+/);
  let detectedNominal: number | null = null;
  const removedIndices = new Set<number>();

  // 1. Multi-word currency first: "1.5 juta", "500 ribu", "50 ribu", "Rp 50.000"
  for (let i = 0; i < words.length - 1; i++) {
    const combined = `${words[i]} ${words[i + 1]}`;
    const curr = parseIndonesianCurrency(combined);
    if (curr !== null && curr > 0) {
      detectedNominal = curr;
      removedIndices.add(i);
      removedIndices.add(i + 1);
      break;
    }
  }

  // 2. Single-word currency tokens: "15rb", "500k", "50000"
  if (detectedNominal === null) {
    for (let i = 0; i < words.length; i++) {
      const curr = parseIndonesianCurrency(words[i]);
      if (curr !== null && curr > 0) {
        detectedNominal = curr;
        removedIndices.add(i);
        break;
      }
    }
  }

  if (detectedNominal === null || detectedNominal <= 0) {
    return null;
  }

  // Remove the currency word to get description
  const remainingWords = words.filter((_, idx) => !removedIndices.has(idx));
  const remainingText = remainingWords.join(' ').trim();

  // Detect wallet name if mentioned
  let walletName: string | undefined;
  const knownWallets = ['bca', 'mandiri', 'bri', 'bni', 'gopay', 'ovo', 'dana', 'shopeepay', 'tunai', 'cash', 'jago', 'seabank'];
  const finalNotesWords: string[] = [];
  for (const w of remainingWords) {
    if (knownWallets.includes(w.toLowerCase())) {
      walletName = w.toUpperCase();
    } else {
      finalNotesWords.push(w);
    }
  }

  const catatan = finalNotesWords.join(' ').trim() || remainingText || 'Tanpa Catatan';

  // Categorize
  let kategori = isIncome ? 'Gaji' : 'Lain-lain';
  const lowerCatatan = catatan.toLowerCase();
  if (isIncome) {
    if (lowerCatatan.includes('hadiah')) kategori = 'Hadiah';
    else if (lowerCatatan.includes('bisnis') || lowerCatatan.includes('jual')) kategori = 'Bisnis';
    else if (lowerCatatan.includes('dividen') || lowerCatatan.includes('profit')) kategori = 'Investasi Profit';
    else kategori = 'Gaji';
  } else {
    if (lowerCatatan.includes('kopi') || lowerCatatan.includes('makan') || lowerCatatan.includes('resto') || lowerCatatan.includes('sarapan') || lowerCatatan.includes('padang') || lowerCatatan.includes('bakso')) {
      kategori = 'Makanan & Minuman';
    } else if (lowerCatatan.includes('bensin') || lowerCatatan.includes('grab') || lowerCatatan.includes('gojek') || lowerCatatan.includes('tol') || lowerCatatan.includes('parkir')) {
      kategori = 'Transportasi';
    } else if (lowerCatatan.includes('listrik') || lowerCatatan.includes('wifi') || lowerCatatan.includes('air') || lowerCatatan.includes('pulsa') || lowerCatatan.includes('tagihan')) {
      kategori = 'Tagihan & Utilitas';
    } else if (lowerCatatan.includes('baju') || lowerCatatan.includes('sepatu') || lowerCatatan.includes('tokopedia') || lowerCatatan.includes('shopee') || lowerCatatan.includes('belanja')) {
      kategori = 'Belanja';
    } else if (lowerCatatan.includes('nonton') || lowerCatatan.includes('bioskop') || lowerCatatan.includes('game') || lowerCatatan.includes('steam')) {
      kategori = 'Hiburan';
    } else if (lowerCatatan.includes('obat') || lowerCatatan.includes('dokter') || lowerCatatan.includes('apotek')) {
      kategori = 'Kesehatan';
    }
  }

  return {
    jenis: isIncome ? 'income' : 'expense',
    nominal: detectedNominal,
    kategori,
    catatan,
    walletName,
  };
}

/**
 * Format currency to Indonesian Rupiah standard (e.g. "Rp 1.500.000")
 */
export function formatRupiah(amount: number): string {
  const parts = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${parts}`;
}

/**
 * Visual budget progress bar with █ and ░
 */
export function renderProgressBar(percentage: number, length = 10): string {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const filledCount = Math.round((clamped / 100) * length);
  const emptyCount = length - filledCount;
  return `${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)}`;
}

/**
 * Format WIB reply matching TataDana standard specifications
 */
export function formatWibBotReply(options: {
  jenis: 'expense' | 'income' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  walletName: string;
  walletBalance: number;
  dateWib: string;
  budget?: { monthlyAmount: number; spentAmount: number } | null;
  transcript?: string;
  anomalyWarning?: string;
}): string {
  const lines: string[] = [];

  if (options.transcript) {
    lines.push(`🎙️ Transkrip: "${options.transcript}"\n`);
  }

  if (options.jenis === 'expense') {
    lines.push(`💸 **PENGELUARAN TERCATAT**`);
    lines.push(`• Nominal: **${formatRupiah(options.nominal)}**`);
    lines.push(`• Kategori: ${options.kategori}`);
    lines.push(`• Dompet: ${options.walletName} (Sisa: ${formatRupiah(options.walletBalance)})`);
    lines.push(`• Catatan: ${options.catatan}`);
    lines.push(`• Waktu: ${options.dateWib}`);

    if (options.budget) {
      const pct = Math.round((options.budget.spentAmount / options.budget.monthlyAmount) * 100);
      const bar = renderProgressBar(pct);
      lines.push(`\n📊 **Status Budget ${options.kategori}:**`);
      lines.push(`[${bar}] ${pct}% (${formatRupiah(options.budget.spentAmount)} / ${formatRupiah(options.budget.monthlyAmount)})`);
      if (pct >= 100) {
        lines.push(`⚠️ **PERINGATAN**: Budget kategori ini telah mencapai atau melampaui batas 100%!`);
      } else if (pct >= 80) {
        lines.push(`⚠️ Peringatan: Anda telah memakai ${pct}% dari budget bulan ini.`);
      }
    }

    if (options.anomalyWarning) {
      lines.push(`\n💡 **AI Advisor Alert**: ${options.anomalyWarning}`);
    }
  } else if (options.jenis === 'income') {
    lines.push(`💰 **PEMASUKAN TERCATAT**`);
    lines.push(`• Nominal: **${formatRupiah(options.nominal)}**`);
    lines.push(`• Kategori: ${options.kategori}`);
    lines.push(`• Dompet: ${options.walletName} (Saldo: ${formatRupiah(options.walletBalance)})`);
    lines.push(`• Catatan: ${options.catatan}`);
    lines.push(`• Waktu: ${options.dateWib}`);
    lines.push(`\n✨ *Mantap! Jangan lupa sisihkan minimal 20% untuk tabungan dan investasi.*`);
  } else {
    lines.push(`🔄 **TRANSFER BERHASIL**`);
    lines.push(`• Nominal: **${formatRupiah(options.nominal)}**`);
    lines.push(`• Catatan: ${options.catatan}`);
    lines.push(`• Waktu: ${options.dateWib}`);
  }

  return lines.join('\n');
}

// -------------------------------------------------------------
// IN-MEMORY SINGLETON DATA STORE
// -------------------------------------------------------------

export class DataStore {
  public profiles: Map<string, Profile> = new Map();
  public wallets: Map<string, Wallet> = new Map();
  public categories: Map<string, Category> = new Map();
  public budgets: Map<string, Budget> = new Map();
  public transactions: Map<string, Transaction> = new Map();
  public transactionItems: Map<string, TransactionItem> = new Map();
  public aiProviders: Map<string, AiProvider> = new Map();
  public aiLogs: Map<string, AiLog> = new Map();
  public telegramUpdates: Map<number, TelegramUpdate> = new Map();
  public paymentTransactions: Map<string, PaymentTransaction> = new Map();
  public exportHistories: Map<string, ExportHistory> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();
  public sessions: Map<string, Session> = new Map();
  public magicTokens: Map<string, { token: string; user_id: string; expires_at: number; used: boolean }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public createMagicToken(userId: string): string {
    const token = `mlt_${Date.now()}_${Math.random().toString(36).substring(2, 14)}`;
    this.magicTokens.set(token, {
      token,
      user_id: userId,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
      used: false,
    });
    return token;
  }

  public consumeMagicToken(token: string): { ok: boolean; error?: string; session?: Session; user?: Profile } {
    if (!token) return { ok: false, error: 'Token tidak boleh kosong' };
    const record = this.magicTokens.get(token);
    if (!record) return { ok: false, error: 'Token login tidak ditemukan atau tidak valid' };
    if (record.used) return { ok: false, error: 'Token login sudah pernah digunakan' };
    if (record.expires_at < Date.now()) return { ok: false, error: 'Token login sudah kedaluwarsa' };

    const user = this.profiles.get(record.user_id);
    if (!user) return { ok: false, error: 'User tidak ditemukan' };
    if (user.verification_status !== 'approved') {
      return { ok: false, error: 'Akun belum disetujui oleh admin' };
    }

    record.used = true;
    const session = this.createSession(user.user_id);
    return { ok: true, session: session!, user };
  }

  public createSession(userId: string): Session | null {
    const user = this.profiles.get(userId);
    if (!user) return null;
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const session: Session = {
      token,
      user_id: user.user_id,
      email: user.email || null,
      role: user.role || (user.is_admin ? 'admin' : 'user'),
      is_admin: !!user.is_admin,
      verification_status: user.verification_status || 'approved',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    this.sessions.set(token, session);
    return session;
  }

  public getSession(token: string): Session | null {
    if (!token) return null;
    const s = this.sessions.get(token);
    if (!s) return null;
    if (new Date(s.expires_at) < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    return s;
  }

  public destroySession(token: string): void {
    if (token) this.sessions.delete(token);
  }

  public seedInitialData() {
    // 1. AI Providers
    this.aiProviders.set('ai-gemini', {
      id: 'ai-gemini',
      provider_name: 'gemini',
      api_key_encrypted: 'AIzaSy_demo_gemini_key_sec',
      is_active: true,
      mode: 'failover',
      priority: 1,
    });
    this.aiProviders.set('ai-openai', {
      id: 'ai-openai',
      provider_name: 'openai',
      api_key_encrypted: 'sk_demo_openai_key_sec',
      is_active: true,
      mode: 'failover',
      priority: 2,
    });
    this.aiProviders.set('ai-deepseek', {
      id: 'ai-deepseek',
      provider_name: 'deepseek',
      api_key_encrypted: 'sk_demo_deepseek_key_sec',
      is_active: false,
      mode: 'failover',
      priority: 3,
    });

    // 2. Demo User Profile (Pro Plan, Approved)
    const demoUserId = 'usr_demo_tatadana';
    this.createUser({
      userId: demoUserId,
      email: 'demo@tatadana.id',
      fullName: 'Ahmad Fauzan',
      phoneNumber: '081234567890',
      plan: 'pro',
      isAdmin: false,
      verificationStatus: 'approved',
      password: 'tatadana123',
    });

    // 3. Primary Official Admin User Profile (halidanazla10@gmail.com)
    const adminUserId = 'usr_admin_halida';
    this.createUser({
      userId: adminUserId,
      email: 'halidanazla10@gmail.com',
      fullName: 'Halida Nazla (Admin)',
      username: 'halidanazla',
      phoneNumber: '081299990001',
      plan: 'pro',
      isAdmin: true,
      role: 'admin',
      verificationStatus: 'approved',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'HalidaTataDana2026!',
    });

    // Set demo user wallets: Initialized strictly to Rp 0
    const demoWallets = Array.from(this.wallets.values()).filter((w) => w.user_id === demoUserId);
    const defaultTunai = demoWallets[0];
    defaultTunai.balance = 0;

    // Additional Wallets for Demo (Clean Rp 0 Balance)
    const bcaWallet: Wallet = {
      id: `wal_${demoUserId}_bca`,
      user_id: demoUserId,
      name: 'BCA Prioritas',
      type: 'bank',
      balance: 0,
      is_telegram_default: true,
      created_at: new Date().toISOString(),
    };
    defaultTunai.is_telegram_default = false;
    this.wallets.set(bcaWallet.id, bcaWallet);

    const gopayWallet: Wallet = {
      id: `wal_${demoUserId}_gopay`,
      user_id: demoUserId,
      name: 'GoPay',
      type: 'ewallet',
      balance: 0,
      is_telegram_default: false,
      created_at: new Date().toISOString(),
    };
    this.wallets.set(gopayWallet.id, gopayWallet);

    const mandiriWallet: Wallet = {
      id: `wal_${demoUserId}_mandiri`,
      user_id: demoUserId,
      name: 'Bank Mandiri',
      type: 'bank',
      balance: 0,
      is_telegram_default: false,
      created_at: new Date().toISOString(),
    };
    this.wallets.set(mandiriWallet.id, mandiriWallet);

    // Categories
    const foodCat = Array.from(this.categories.values()).find((c) => c.user_id === demoUserId && c.name === 'Makanan & Minuman');
    const transCat = Array.from(this.categories.values()).find((c) => c.user_id === demoUserId && c.name === 'Transportasi');
    const billCat = Array.from(this.categories.values()).find((c) => c.user_id === demoUserId && c.name === 'Tagihan & Utilitas');
    const shopCat = Array.from(this.categories.values()).find((c) => c.user_id === demoUserId && c.name === 'Belanja');
    const salaryCat = Array.from(this.categories.values()).find((c) => c.user_id === demoUserId && c.name === 'Gaji');

    // Budgets for current month: Clean initial state (spent_amount: 0)
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    // Zero-state: No fake/dummy transactions or pre-allocated budgets; all accounts start completely clean with Rp 0

    // Payment Transactions for Admin review
    this.paymentTransactions.set('pay_001', {
      id: 'pay_001',
      user_id: demoUserId,
      plan: 'pro',
      amount: 49000,
      payment_type: 'midtrans_snap',
      midtrans_order_id: 'TATADANA-PRO-20261010-001',
      status: 'settlement',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    });

    this.paymentTransactions.set('pay_002', {
      id: 'pay_002',
      user_id: 'usr_manual_01',
      plan: 'pro',
      amount: 49000,
      payment_type: 'manual_transfer',
      midtrans_order_id: 'MANUAL-20261014-889',
      status: 'pending',
      proof_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    // AI Logs
    this.aiLogs.set('log_001', {
      id: 'log_001',
      user_id: demoUserId,
      provider: 'gemini-1.5-flash',
      prompt_tokens: 124,
      completion_tokens: 48,
      input_type: 'text',
      latency_ms: 412,
      status: 'success',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    });

    this.aiLogs.set('log_002', {
      id: 'log_002',
      user_id: demoUserId,
      provider: 'gemini-1.5-flash',
      prompt_tokens: 950,
      completion_tokens: 280,
      input_type: 'vision_ocr',
      latency_ms: 1280,
      status: 'success',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    });
  }

  public createUser(params: {
    userId: string;
    email?: string;
    fullName: string;
    username?: string;
    phoneNumber?: string;
    isAdmin?: boolean;
    role?: 'user' | 'superadmin' | 'admin';
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    savingPreference?: string;
    plan?: 'starter' | 'pro';
    password?: string;
  }): Profile {
    const isActuallyAdmin = !!params.isAdmin || params.role === 'admin' || params.role === 'superadmin';
    const normalizedEmail = params.email ? params.email.trim().toLowerCase() : null;
    const computedUsername = (params.username || (normalizedEmail ? normalizedEmail.split('@')[0] : `user_${params.userId}`)).toLowerCase().trim();
    const profile: Profile = {
      id: `prof_${params.userId}`,
      user_id: params.userId,
      username: computedUsername,
      email: normalizedEmail,
      phone_number: params.phoneNumber || null,
      phone_verified: !!params.phoneNumber,
      full_name: params.fullName,
      avatar_url: null,
      default_currency: 'IDR',
      plan: params.plan || 'starter',
      role: isActuallyAdmin ? 'admin' : (params.role || 'user'),
      is_admin: isActuallyAdmin,
      verification_status: isActuallyAdmin ? 'approved' : (params.verificationStatus || 'pending'),
      saving_preference: params.savingPreference || null,
      telegram_user_id: null,
      telegram_chat_id: null,
      telegram_pairing_code: `LINK_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      daily_reminder_enabled: true,
      daily_reminder_time_1: '08:00',
      daily_reminder_time_2: '20:00',
      password: params.password || 'tatadana123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(params.userId, profile);

    // Trigger 1: Default Wallet "Tunai"
    const defaultWallet: Wallet = {
      id: `wal_${params.userId}_tunai`,
      user_id: params.userId,
      name: 'Tunai',
      type: 'cash',
      balance: 0,
      is_telegram_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.wallets.set(defaultWallet.id, defaultWallet);

    // Trigger 2: Clone 14 default categories
    SEED_CATEGORIES.forEach((sc, idx) => {
      const catId = `cat_${params.userId}_${idx}`;
      this.categories.set(catId, {
        ...sc,
        id: catId,
        user_id: params.userId,
        created_at: new Date().toISOString(),
      });
    });

    return profile;
  }

  public createTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    // 1. Quota check for starter plan (max 50 tx/month)
    const profile = this.profiles.get(tx.user_id);
    if (profile && profile.plan === 'starter') {
      const monthPrefix = tx.date_wib.slice(0, 7);
      const monthlyTxCount = Array.from(this.transactions.values()).filter(
        (t) => t.user_id === tx.user_id && t.date_wib.startsWith(monthPrefix)
      ).length;

      if (monthlyTxCount >= 50) {
        throw new Error('QUOTA_EXCEEDED: Batas transaksi paket Starter (50/bulan) telah tercapai. Silakan upgrade ke Pro.');
      }
    }

    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // 2. Trigger: sync_wallet_balance
    const wallet = this.wallets.get(tx.wallet_id);
    if (!wallet) {
      throw new Error(`Wallet not found: ${tx.wallet_id}`);
    }

    if (tx.type === 'expense') {
      wallet.balance -= tx.amount;
    } else if (tx.type === 'income') {
      wallet.balance += tx.amount;
    } else if (tx.type === 'transfer') {
      if (!tx.to_wallet_id) throw new Error('to_wallet_id is required for transfer');
      const targetWallet = this.wallets.get(tx.to_wallet_id);
      if (!targetWallet) throw new Error(`Target wallet not found: ${tx.to_wallet_id}`);
      wallet.balance -= tx.amount;
      targetWallet.balance += tx.amount;
    }

    // 3. Trigger: sync_budget_spent
    if (tx.type === 'expense') {
      const txDate = new Date(tx.date_wib);
      const txMonth = txDate.getMonth() + 1;
      const txYear = txDate.getFullYear();

      for (const b of this.budgets.values()) {
        if (
          b.user_id === tx.user_id &&
          b.category_id === tx.category_id &&
          b.period_month === txMonth &&
          b.period_year === txYear
        ) {
          b.spent_amount += tx.amount;
        }
      }
    }

    this.transactions.set(newTx.id, newTx);
    return newTx;
  }
}

// Global persistent instance for local dev & server runtime
const globalForStore = globalThis as unknown as { tatadanaStore?: DataStore };
export const store = globalForStore.tatadanaStore ?? new DataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.tatadanaStore = store;

export const SAVING_OPTIONS = {
  tabungan: {
    key: 'tabungan',
    title: '🏦 Tabungan Bank',
    lps: 'Dijamin LPS (Lembaga Penjamin Simpanan) hingga Rp 2 Miliar per nasabah per bank.',
    lock: 'Tidak ada penguncian dana (bisa ditarik kapan saja melalui ATM atau m-banking 24/7).',
    liquidity: 'Sangat Tinggi (Instan 24/7).',
    risk: 'Sangat Rendah (Bebas risiko pasar modal, bunga 0.5% - 2% p.a.).',
    summary: 'Aman dan likuid untuk operasional harian.',
  },
  ewallet: {
    key: 'ewallet',
    title: '📱 E-Wallet (GoPay, OVO, DANA, ShopeePay)',
    lps: 'TIDAK dijamin oleh LPS. Dana disimpan pada bank mitra dalam bentuk floating fund / trust account di bawah BI.',
    lock: 'Tidak ada penguncian dana, tetapi terdapat batas limit saldo regulasi BI.',
    liquidity: 'Sangat Tinggi (Instan untuk belanja QRIS harian).',
    risk: 'Rendah-Sedang (Bukan instrumen investasi, terdapat risiko keamanan akun / credential).',
    summary: 'Sangat praktis untuk uang saku dan transaksi mikro harian.',
  },
  deposito: {
    key: 'deposito',
    title: '🔒 Deposito Bank',
    lps: 'Dijamin LPS (hingga Rp 2 Miliar per bank selama suku bunga wajar LPS).',
    lock: 'Dana DIKUNCI sesuai tenor pilihan (1, 3, 6, atau 12 bulan). Pencairan awal kena penalti.',
    liquidity: 'Rendah (Hanya saat jatuh tempo tenor).',
    risk: 'Sangat Rendah (Imbal hasil terprediksi 3% - 6% p.a.).',
    summary: 'Cocok untuk memarkir idle cash 6-12 bulan.',
  },
  rdpu: {
    key: 'rdpu',
    title: '📈 Reksadana Pasar Uang (RDPU)',
    lps: 'TIDAK dijamin oleh LPS karena instrumen pasar modal (diawasi OJK, kustodian bank aman).',
    lock: 'Tidak ada penguncian dana (bisa dicairkan kapan saja tanpa denda).',
    liquidity: 'Tinggi (Pencairan T+1 hingga T+2 hari kerja).',
    risk: 'Rendah (Obligasi jangka pendek & deposito, potensi hasil 4% - 6% p.a., bebas pajak).',
    summary: 'Cocok untuk dana darurat & tabungan 1-2 tahun.',
  },
  rekomendasi: {
    key: 'rekomendasi',
    title: '🤔 Belum Tahu / Rekomendasi Alokasi TataDana',
    lps: 'Pahami: Tabungan & Deposito dilindungi LPS (maks Rp 2M), sedangkan E-Wallet & RDPU TIDAK dijamin LPS.',
    lock: 'Terapkan piramida likuiditas 4 kantong.',
    liquidity: 'Seimbangkan antara instan vs bertumbuh.',
    risk: 'Diversifikasi instrumen meminimalkan risiko.',
    summary: '1. E-Wallet (5-10%)\n2. Tabungan Bank (20-30%)\n3. RDPU (30-40%)\n4. Deposito (20-30%).',
  },
};

export const DISCLAIMER_FINANSIAL = '⚠️ PERINGATAN WAJIB TATADANA: TataDana tidak menjanjikan imbal hasil pasti atau garansi keuntungan investasi. Semua keputusan keuangan merupakan tanggung jawab pribadi Anda.';

export function handleSavingPlacesChat(content: string, user: Profile | null = null) {
  if (!content || typeof content !== 'string') return null;
  const lower = content.toLowerCase().trim();

  const triggers = [
    '/simpan', '/nabung', 'simpan', 'menabung', 'tempat simpan', 'simpan uang',
    'tabungan', 'deposito', 'rdpu', 'ewallet', 'e-wallet', 'dompet digital', 'digital wallet',
    'rekomendasi simpan', 'rekomendasi nabung', 'pilihan tempat menyimpan uang', 'reksadana',
    'simpan dana', 'tempat menabung', 'tujuan menabung', 'opsi 1', 'opsi 2', 'opsi 3', 'opsi 4', 'opsi 5',
    'pilihan 1', 'pilihan 2', 'pilihan 3', 'pilihan 4', 'pilihan 5', '1', '2', '3', '4', '5'
  ];

  const hasTrigger = triggers.some((t) => lower === t || lower.includes(t));
  if (!hasTrigger) return null;

  const optionsList = [
    '🏦 Tabungan Bank',
    '📱 E-Wallet',
    '🔒 Deposito Bank',
    '📈 Reksadana Pasar Uang (RDPU)',
    '🤔 Belum Tahu / Rekomendasi'
  ];

  if ((lower.includes('tabungan') || lower === '1' || lower.includes('opsi 1') || lower.includes('pilihan 1')) && !lower.includes('pilihan tempat') && !lower.includes('tempat simpan')) {
    const opt = SAVING_OPTIONS.tabungan;
    if (user) user.saving_preference = opt.title;
    return {
      instrument: 'tabungan',
      preferenceTitle: opt.title,
      replyText: `${opt.title}\n\nJaminan LPS: ${opt.lps}\nKunci Dana: ${opt.lock}\nLikuiditas: ${opt.liquidity}\nRisiko: ${opt.risk}\n\n${DISCLAIMER_FINANSIAL}`,
      options: optionsList,
    };
  }

  if (lower.includes('ewallet') || lower.includes('e-wallet') || lower.includes('dompet digital') || lower.includes('digital wallet') || lower === '2' || lower.includes('opsi 2') || lower.includes('pilihan 2')) {
    const opt = SAVING_OPTIONS.ewallet;
    if (user) user.saving_preference = opt.title;
    return {
      instrument: 'ewallet',
      preferenceTitle: opt.title,
      replyText: `${opt.title}\n\nJaminan LPS: ${opt.lps}\nKunci Dana: ${opt.lock}\nLikuiditas: ${opt.liquidity}\nRisiko: ${opt.risk}\n\n${DISCLAIMER_FINANSIAL}`,
      options: optionsList,
    };
  }

  if (lower.includes('deposito') || lower === '3' || lower.includes('opsi 3') || lower.includes('pilihan 3')) {
    const opt = SAVING_OPTIONS.deposito;
    if (user) user.saving_preference = opt.title;
    return {
      instrument: 'deposito',
      preferenceTitle: opt.title,
      replyText: `${opt.title}\n\nJaminan LPS: ${opt.lps}\nKunci Dana: ${opt.lock}\nLikuiditas: ${opt.liquidity}\nRisiko: ${opt.risk}\n\n${DISCLAIMER_FINANSIAL}`,
      options: optionsList,
    };
  }

  if (lower.includes('rdpu') || lower.includes('reksadana') || lower === '4' || lower.includes('opsi 4') || lower.includes('pilihan 4')) {
    const opt = SAVING_OPTIONS.rdpu;
    if (user) user.saving_preference = opt.title;
    return {
      instrument: 'rdpu',
      preferenceTitle: opt.title,
      replyText: `${opt.title}\n\nJaminan LPS: ${opt.lps}\nKunci Dana: ${opt.lock}\nLikuiditas: ${opt.liquidity}\nRisiko: ${opt.risk}\n\n${DISCLAIMER_FINANSIAL}`,
      options: optionsList,
    };
  }

  if (lower === '5' || lower.includes('opsi 5') || lower.includes('pilihan 5')) {
    const opt = SAVING_OPTIONS.rekomendasi;
    if (user) user.saving_preference = opt.title;
    return {
      instrument: 'rekomendasi',
      preferenceTitle: opt.title,
      replyText: `${opt.title}\n\nJaminan LPS: ${opt.lps}\nKunci Dana: ${opt.lock}\nLikuiditas: ${opt.liquidity}\nRisiko: ${opt.risk}\n\nRekomendasi Alokasi:\n${opt.summary}\n\n${DISCLAIMER_FINANSIAL}`,
      options: optionsList,
    };
  }

  return {
    instrument: 'all',
    preferenceTitle: null,
    replyText: `💡 PANDUAN 5 PILIHAN TEMPAT MENYIMPAN UANG TATADANA\n\n1. 🏦 Tabungan Bank (Dijamin LPS s.d 2M)\n2. 📱 E-Wallet (TIDAK Dijamin LPS)\n3. 🔒 Deposito Bank (Dijamin LPS, Dikunci Tenor)\n4. 📈 Reksadana Pasar Uang / RDPU (TIDAK Dijamin LPS, Pasar Modal)\n5. 🤔 Belum Tahu / Rekomendasi Alokasi Ideal\n\nKetik nomor 1-5 atau klik tombol di bawah untuk melihat rincian jaminan LPS, risiko, dan tenor penguncian dana.\n\n${DISCLAIMER_FINANSIAL}`,
    options: optionsList,
  };
}
