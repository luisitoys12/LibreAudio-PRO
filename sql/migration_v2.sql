-- ============================================================
-- LibreAudio PRO — Migration v2.0
-- Agrega soporte para Radio, TV, Paneles (AzuraCast, etc.)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Nuevos campos en la tabla content
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS subtitle        TEXT,
  ADD COLUMN IF NOT EXISTS panel_type      TEXT DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS stream_url      TEXT,
  ADD COLUMN IF NOT EXISTS embed_url       TEXT,
  ADD COLUMN IF NOT EXISTS country         TEXT,
  ADD COLUMN IF NOT EXISTS city            TEXT,
  ADD COLUMN IF NOT EXISTS current_listeners INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS now_playing     TEXT;

-- 2. Nuevos valores para el ENUM de tipo
-- (Supabase usa TEXT con check, no ENUM estricto)
-- Si usas un check constraint, actualízalo así:
DO $$
BEGIN
  -- Eliminar constraint anterior si existe
  ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_type_check;
  -- Agregar nuevo con todos los tipos
  ALTER TABLE public.content ADD CONSTRAINT content_type_check
    CHECK (type IN ('radio','podcast','musica','stream_en_vivo','tv_en_vivo','tv_grabado','otro'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint no encontrado, continuando...';
END $$;

-- 3. Índices para búsqueda rápida por tipo y país
CREATE INDEX IF NOT EXISTS idx_content_type    ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_country ON public.content(country);
CREATE INDEX IF NOT EXISTS idx_content_panel   ON public.content(panel_type);
CREATE INDEX IF NOT EXISTS idx_content_plays   ON public.content(plays DESC);

-- 4. Función increment_plays (por si no existe)
CREATE OR REPLACE FUNCTION increment_plays(content_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.content SET plays = plays + 1 WHERE id = content_id;
END;
$$;

-- 5. Verificar resultado
SELECT
  column_name, data_type
FROM information_schema.columns
WHERE table_name = 'content'
  AND table_schema = 'public'
ORDER BY ordinal_position;
