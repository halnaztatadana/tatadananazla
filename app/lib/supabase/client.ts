import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  const supabaseUrl =
    typeof window !== 'undefined'
      ? (window as any).ENV?.VITE_SUPABASE_URL || 'https://sandbox.supabase.co'
      : process.env.VITE_SUPABASE_URL || 'https://sandbox.supabase.co';

  const supabaseAnonKey =
    typeof window !== 'undefined'
      ? (window as any).ENV?.VITE_SUPABASE_ANON_KEY || 'sandbox_anon_key_mock_fallback'
      : process.env.VITE_SUPABASE_ANON_KEY || 'sandbox_anon_key_mock_fallback';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
