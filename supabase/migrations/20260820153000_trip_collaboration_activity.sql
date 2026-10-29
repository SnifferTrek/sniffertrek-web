-- Kollaboration: Präsenz («gerade bearbeitet») + Änderungsprotokoll
-- Im Supabase SQL Editor ausführen (gesamte Datei).
-- Voraussetzung: trip_collaborators aus 20260820120000_trip_sharing.sql

-- ---------------------------------------------------------------------------
-- Hilfsfunktion: Zugriff auf Reise?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_can_access_trip(p_trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = p_trip_id AND t.user_id::text = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM public.trip_collaborators c
        WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.user_can_access_trip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_trip(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_trip(text) TO service_role;

-- ---------------------------------------------------------------------------
-- Präsenz
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_presence (
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_label TEXT NOT NULL DEFAULT '',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_presence_seen
  ON public.trip_presence (trip_id, last_seen_at DESC);

ALTER TABLE public.trip_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_presence_select" ON public.trip_presence;
DROP POLICY IF EXISTS "trip_presence_upsert" ON public.trip_presence;
DROP POLICY IF EXISTS "trip_presence_update" ON public.trip_presence;
DROP POLICY IF EXISTS "trip_presence_delete" ON public.trip_presence;

CREATE POLICY "trip_presence_select"
  ON public.trip_presence FOR SELECT
  USING (public.user_can_access_trip(trip_id));

CREATE POLICY "trip_presence_insert"
  ON public.trip_presence FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND public.user_can_access_trip(trip_id)
  );

CREATE POLICY "trip_presence_update"
  ON public.trip_presence FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "trip_presence_delete"
  ON public.trip_presence FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
      )
    )
  );

REVOKE ALL ON public.trip_presence FROM PUBLIC;
REVOKE ALL ON public.trip_presence FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_presence TO authenticated;
GRANT ALL ON public.trip_presence TO service_role;

-- ---------------------------------------------------------------------------
-- Änderungsprotokoll
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_label TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT 'update',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_activity_trip_created
  ON public.trip_activity (trip_id, created_at DESC);

ALTER TABLE public.trip_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_activity_select" ON public.trip_activity;
DROP POLICY IF EXISTS "trip_activity_insert" ON public.trip_activity;

CREATE POLICY "trip_activity_select"
  ON public.trip_activity FOR SELECT
  USING (public.user_can_access_trip(trip_id));

CREATE POLICY "trip_activity_insert"
  ON public.trip_activity FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND public.user_can_access_trip(trip_id)
  );

REVOKE ALL ON public.trip_activity FROM PUBLIC;
REVOKE ALL ON public.trip_activity FROM anon;
GRANT SELECT, INSERT ON public.trip_activity TO authenticated;
GRANT ALL ON public.trip_activity TO service_role;
