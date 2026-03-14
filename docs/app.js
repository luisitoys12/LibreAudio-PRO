// ============================================================
// LibreAudio PRO — app.js  v3.2
// Fix completo: reproductor, botones, Dailymotion, iHeart, TuneIn
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TuneIn, iHeart, Dailymotion, PlayerResolver, Social, loadHlsJs, Metadata } from './integrations.js';

// ── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL  = window.SUPABASE_URL  || 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON = window.SUPABASE_ANON || 'TU_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true }
});