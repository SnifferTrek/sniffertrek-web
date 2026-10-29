-- Reise-Freigabe: Einladungs-Links + Mitbearbeiter
-- Im Supabase SQL Editor ausführen (gesamte Datei).

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_shares_trip_id ON public.trip_shares(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON public.trip_shares(token) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.trip_collaborators (
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  share_id UUID REFERENCES public.trip_shares(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON public.trip_collaborators(user_id);

-- ---------------------------------------------------------------------------
-- RLS: trip_shares
-- ---------------------------------------------------------------------------

ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_shares_select_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_insert_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_update_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_delete_own" ON public.trip_shares;

CREATE POLICY "trip_shares_select_own"
  ON public.trip_shares FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.trips t
        WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
      )
    )
  );

CREATE POLICY "trip_shares_insert_own"
  ON public.trip_shares FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "trip_shares_update_own"
  ON public.trip_shares FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "trip_shares_delete_own"
  ON public.trip_shares FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
    )
  );

REVOKE ALL ON public.trip_shares FROM PUBLIC;
REVOKE ALL ON public.trip_shares FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_shares TO authenticated;
GRANT ALL ON public.trip_shares TO service_role;

-- ---------------------------------------------------------------------------
-- RLS: trip_collaborators
-- ---------------------------------------------------------------------------

ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_collaborators_select" ON public.trip_collaborators;
DROP POLICY IF EXISTS "trip_collaborators_delete_self" ON public.trip_collaborators;
DROP POLICY IF EXISTS "trip_collaborators_delete_owner" ON public.trip_collaborators;

CREATE POLICY "trip_collaborators_select"
  ON public.trip_collaborators FOR SELECT
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

-- Insert nur über SECURITY DEFINER RPC accept_trip_share
CREATE POLICY "trip_collaborators_delete_self"
  ON public.trip_collaborators FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "trip_collaborators_delete_owner"
  ON public.trip_collaborators FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.user_id::text = auth.uid()::text
    )
  );

REVOKE ALL ON public.trip_collaborators FROM PUBLIC;
REVOKE ALL ON public.trip_collaborators FROM anon;
GRANT SELECT, DELETE ON public.trip_collaborators TO authenticated;
GRANT ALL ON public.trip_collaborators TO service_role;

-- ---------------------------------------------------------------------------
-- RLS: trips – Mitbearbeiter dürfen lesen / Editoren schreiben
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "trips_select_collab" ON public.trips;
DROP POLICY IF EXISTS "trips_update_collab" ON public.trips;

-- Hinweis: Collab-Policies werden in 20260821130000_fix_trips_rls_recursion.sql
-- sicher über SECURITY DEFINER gesetzt (kein RLS-Loop).

-- ---------------------------------------------------------------------------
-- RPCs: Vorschau + Einladung annehmen (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_trip_share_preview(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.trip_shares%ROWTYPE;
  t public.trips%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  SELECT * INTO s
  FROM public.trip_shares
  WHERE token = p_token AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;

  SELECT * INTO t FROM public.trips WHERE id = s.trip_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'tripId', t.id,
    'tripName', t.name,
    'role', s.role,
    'isOwner', t.user_id::text = auth.uid()::text,
    'alreadyJoined', EXISTS (
      SELECT 1 FROM public.trip_collaborators c
      WHERE c.trip_id = t.id AND c.user_id = auth.uid()
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_trip_share(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.trip_shares%ROWTYPE;
  t public.trips%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  SELECT * INTO s
  FROM public.trip_shares
  WHERE token = p_token AND revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;

  SELECT * INTO t FROM public.trips WHERE id = s.trip_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing');
  END IF;

  IF t.user_id::text = auth.uid()::text THEN
    RETURN jsonb_build_object('ok', true, 'tripId', t.id, 'role', 'owner', 'alreadyOwner', true);
  END IF;

  INSERT INTO public.trip_collaborators (trip_id, user_id, role, share_id)
  VALUES (s.trip_id, auth.uid(), s.role, s.id)
  ON CONFLICT (trip_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        share_id = EXCLUDED.share_id;

  RETURN jsonb_build_object('ok', true, 'tripId', t.id, 'role', s.role);
END;
$$;

REVOKE ALL ON FUNCTION public.get_trip_share_preview(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_trip_share(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trip_share_preview(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_trip_share(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_share_preview(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_trip_share(text) TO service_role;
