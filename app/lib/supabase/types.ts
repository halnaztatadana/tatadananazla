export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanType = 'starter' | 'pro';
export type RoleType = 'user' | 'superadmin';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'other';
export type CategoryType = 'expense' | 'income';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice' | 'api';
export type AIProviderMode = 'single' | 'parallel' | 'fallback';
export type AIInputType = 'text' | 'vision' | 'audio';
export type AIStatus = 'success' | 'failed' | 'fallback';
export type TelegramUpdateStatus = 'received' | 'processing' | 'completed' | 'ignored' | 'failed';
export type PaymentType = 'midtrans_snap' | 'manual_transfer' | 'qris' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'settlement' | 'capture' | 'expire' | 'cancel' | 'deny' | 'approved' | 'rejected';
export type ExportFileType = 'pdf' | 'xlsx' | 'csv';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          phone_number: string | null;
          phone_verified: boolean;
          full_name: string | null;
          avatar_url: string | null;
          default_currency: string;
          plan: PlanType;
          role: RoleType;
          telegram_user_id: number | null;
          telegram_chat_id: number | null;
          daily_reminder_enabled: boolean;
          daily_reminder_time_1: string;
          daily_reminder_time_2: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: WalletType;
          balance: number;
          is_telegram_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['wallets']['Row']> & {
          user_id: string;
          name: string;
          type: WalletType;
        };
        Update: Partial<Database['public']['Tables']['wallets']['Row']>;
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: CategoryType;
          emoji: string | null;
          color: string | null;
          is_ai_recommended: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & {
          name: string;
          type: CategoryType;
        };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          monthly_amount: number;
          spent_amount: number;
          period_month: number;
          period_year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['budgets']['Row']> & {
          user_id: string;
          category_id: string;
          monthly_amount: number;
          period_month: number;
          period_year: number;
        };
        Update: Partial<Database['public']['Tables']['budgets']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          category_id: string | null;
          type: TransactionType;
          destination_wallet_id: string | null;
          amount: number;
          date_wib: string;
          notes: string | null;
          source: TransactionSource;
          receipt_url: string | null;
          has_items: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & {
          user_id: string;
          wallet_id: string;
          type: TransactionType;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          item_name: string;
          amount: number;
          category_id: string | null;
          time_wib: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transaction_items']['Row']> & {
          transaction_id: string;
          item_name: string;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['transaction_items']['Row']>;
      };
      ai_providers: {
        Row: {
          id: string;
          provider_name: string;
          api_key_encrypted: string | null;
          is_active: boolean;
          mode: AIProviderMode;
          priority: number;
          model_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ai_providers']['Row']> & {
          provider_name: string;
        };
        Update: Partial<Database['public']['Tables']['ai_providers']['Row']>;
      };
      ai_logs: {
        Row: {
          id: string;
          user_id: string | null;
          provider: string;
          prompt_tokens: number;
          completion_tokens: number;
          input_type: AIInputType;
          latency_ms: number;
          status: AIStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ai_logs']['Row']> & {
          provider: string;
          input_type: AIInputType;
          status: AIStatus;
        };
        Update: Partial<Database['public']['Tables']['ai_logs']['Row']>;
      };
      telegram_updates: {
        Row: {
          update_id: number;
          processed_at: string;
          user_id: string | null;
          status: TelegramUpdateStatus;
          error_details: string | null;
        };
        Insert: Database['public']['Tables']['telegram_updates']['Row'];
        Update: Partial<Database['public']['Tables']['telegram_updates']['Row']>;
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          plan: PlanType;
          amount: number;
          payment_type: PaymentType;
          midtrans_order_id: string | null;
          status: PaymentStatus;
          proof_url: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payment_transactions']['Row']> & {
          user_id: string;
          plan: PlanType;
          amount: number;
          payment_type: PaymentType;
        };
        Update: Partial<Database['public']['Tables']['payment_transactions']['Row']>;
      };
      export_histories: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string;
          file_type: ExportFileType;
          period: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['export_histories']['Row']> & {
          user_id: string;
          file_name: string;
          file_url: string;
          file_type: ExportFileType;
          period: string;
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['export_histories']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          target_user_id: string | null;
          action: string;
          reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & {
          admin_id: string;
          action: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>;
      };
    };
  };
}

// Convenient row type aliases
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type WalletRow = Database['public']['Tables']['wallets']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type BudgetRow = Database['public']['Tables']['budgets']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type TransactionItemRow = Database['public']['Tables']['transaction_items']['Row'];
export type AiProviderRow = Database['public']['Tables']['ai_providers']['Row'];
export type AiLogRow = Database['public']['Tables']['ai_logs']['Row'];
export type TelegramUpdateRow = Database['public']['Tables']['telegram_updates']['Row'];
export type PaymentTransactionRow = Database['public']['Tables']['payment_transactions']['Row'];
export type ExportHistoryRow = Database['public']['Tables']['export_histories']['Row'];
export type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];
