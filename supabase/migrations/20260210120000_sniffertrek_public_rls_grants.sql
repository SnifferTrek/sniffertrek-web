-- SnifferTrek: explizite GRANTs + Row Level Security für die Data API
-- (Supabase-Hinweis ab 2026: neue Tabellen / später alle Projekte)
--
-- Ausführung: Supabase Dashboard → SQL Editor → gesamte Datei einfügen → Run
--
-- Voraussetzung: Tabelle public.trips existiert bereits und hat eine Spalte user_id
-- (uuid oder text mit der gleichen UUID wie auth.users.id).

-- ---------------------------------------------------------------------------
-- public.trips  (Cloud-Sync: select / upsert / delete)
-- ---------------------------------------------------------------------------

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select_own" ON public.trips;
DROP POLICY IF EXISTS "trips_insert_own" ON public.trips;
DROP POLICY IF EXISTS "trips_update_own" ON public.trips;
DROP POLICY IF EXISTS "trips_delete_own" ON public.trips;

-- Zeilen nur für den eingeloggten Nutzer (JWT = authenticated)
-- user_id wird mit auth.uid() verglichen (text-Vergleich = uuid & text-kompatibel)
CREATE POLICY "trips_select_own"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "trips_insert_own"
  ON public.trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "trips_update_own"
  ON public.trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text)
  WITH CHECK (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

CREATE POLICY "trips_delete_own"
  ON public.trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text);

REVOKE ALL ON public.trips FROM PUBLIC;
REVOKE ALL ON public.trips FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

-- ---------------------------------------------------------------------------
-- public.affiliate_clicks  (nur Insert vom Browser; anon + authenticated)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  provider text NOT NULL,
  target_url text NOT NULL,
  trip_id text,
  user_id uuid,
  destination text,
  origin text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url text,
  referrer text,
  user_agent text,
  session_id text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_clicked_at_idx
  ON public.affiliate_clicks (clicked_at DESC);

CREATE INDEX IF NOT EXISTS affiliate_clicks_session_id_idx
  ON public.affiliate_clicks (session_id);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_clicks_insert_anon" ON public.affiliate_clicks;
DROP POLICY IF EXISTS "affiliate_clicks_insert_authenticated" ON public.affiliate_clicks;

-- Tracking auch ohne Login (Anon-Key im Client)
CREATE POLICY "affiliate_clicks_insert_anon"
  ON public.affiliate_clicks
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "affiliate_clicks_insert_authenticated"
  ON public.affiliate_clicks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

REVOKE ALL ON public.affiliate_clicks FROM PUBLIC;

GRANT INSERT ON public.affiliate_clicks TO anon;
GRANT INSERT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;

-- Kein SELECT/UPDATE/DELETE für anon/authenticated → keine öffentliche Auslesbarkeit über die API
