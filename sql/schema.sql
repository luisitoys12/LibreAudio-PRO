-- ============================================================
-- LibreAudio PRO — Supabase Schema
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- ── TABLA: profiles ─────────────────────────────────────────
-- Extiende auth.users con datos de perfil y rol
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLA: content ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description  TEXT CHECK (char_length(description) <= 1000),
  type         TEXT NOT NULL DEFAULT 'radio' CHECK (type IN ('radio', 'podcast', 'musica', 'stream_en_vivo', 'otro')),
  genre        TEXT CHECK (char_length(genre) <= 60),
  language     TEXT DEFAULT 'es' CHECK (char_length(language) <= 10),
  external_url TEXT NOT NULL CHECK (external_url ~* '^https?://'),
  cover_url    TEXT CHECK (cover_url ~* '^https?://'),
  tags         TEXT[] DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  plays        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_status    ON public.content(status);
CREATE INDEX IF NOT EXISTS idx_content_type      ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_user      ON public.content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_created   ON public.content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_title_fts ON public.content USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description,'')));

-- ── FUNCIÓN: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── FUNCIÓN: crear perfil al registrarse ─────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── FUNCIÓN: verificar admin ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── FUNCIÓN: incrementar plays ────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_plays(content_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.content SET plays = plays + 1 WHERE id = content_id;
$$;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content  ENABLE ROW LEVEL SECURITY;

-- Profiles: lectura pública, escritura propia o admin
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Content: solo aprobados son públicos; owner ve los suyos; admin ve todo
CREATE POLICY "content_select_approved"
  ON public.content FOR SELECT TO anon
  USING (status = 'approved');

CREATE POLICY "content_select_own_or_admin"
  ON public.content FOR SELECT TO authenticated
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

CREATE POLICY "content_insert_authenticated"
  ON public.content FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "content_update_admin"
  ON public.content FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "content_delete_admin_or_own"
  ON public.content FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ── HACER PRIMER ADMIN (ajusta el email) ─────────────────────
-- Ejecuta esto DESPUÉS de que el primer usuario se registre:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'tu@email.com'
-- );
