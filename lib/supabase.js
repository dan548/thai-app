import { createClient } from '@supabase/supabase-js';

// Ключи берутся из переменных окружения (.env.local). Publishable/anon-ключ
// безопасен на клиенте: RLS allow-all, приложение личное и однопользовательское.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Понятная подсказка вместо непонятного краша при незаполненном .env.local
  console.warn('[thai-trainer] Не заданы NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY. Запусти /setup или заполни .env.local (см. .env.example).');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
  auth: { persistSession: false },
});
