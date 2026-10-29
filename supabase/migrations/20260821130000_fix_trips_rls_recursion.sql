-- Fix: infinite recursion in trips RLS (trips ↔ trip_collaborators)
-- Im Supabase SQL Editor ausführen (gesamte Datei).

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER Hilfsfunktionen (kein RLS-Loop)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_owns_trip(p_trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = p_trip_id AND t.user_id::text = auth.uid()::text
    );
$$;

CREATE OR REPLACE FUNCTION public.user_is_trip_collaborator(p_trip_id text, p_editor_only boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.trip_collaborators c
      WHERE c.trip_id = p_trip_id
        AND c.user_id = auth.uid()
        AND (NOT p_editor_only OR c.role = 'editor')
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_trip(p_trip_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_owns_trip(p_trip_id)
      OR public.user_is_trip_collaborator(p_trip_id, false);
$$;

REVOKE ALL ON FUNCTION public.user_owns_trip(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_trip_collaborator(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_access_trip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_trip(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_trip_collaborator(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_trip(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_trip(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.user_is_trip_collaborator(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.user_can_access_trip(text) TO service_role;

-- ---------------------------------------------------------------------------
-- trips: Collab-Policies ohne direkten Lookup auf trip_collaborators unter RLS
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "trips_select_collab" ON public.trips;
DROP POLICY IF EXISTS "trips_update_collab" ON public.trips;

CREATE POLICY "trips_select_collab"
  ON public.trips FOR SELECT
  USING (public.user_is_trip_collaborator(id, false));

CREATE POLICY "trips_update_collab"
  ON public.trips FOR UPDATE
  USING (public.user_is_trip_collaborator(id, true))
  WITH CHECK (
    user_id::text IS DISTINCT FROM auth.uid()::text
    AND public.user_is_trip_collaborator(id, true)
  );

-- ---------------------------------------------------------------------------
-- trip_shares: Besitzprüfung ohne RLS-Loop auf trips
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "trip_shares_select_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_insert_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_update_own" ON public.trip_shares;
DROP POLICY IF EXISTS "trip_shares_delete_own" ON public.trip_shares;

CREATE POLICY "trip_shares_select_own"
  ON public.trip_shares FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (created_by = auth.uid() OR public.user_owns_trip(trip_id))
  );

CREATE POLICY "trip_shares_insert_own"
  ON public.trip_shares FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND public.user_owns_trip(trip_id)
  );

CREATE POLICY "trip_shares_update_own"
  ON public.trip_shares FOR UPDATE
  USING (public.user_owns_trip(trip_id))
  WITH CHECK (public.user_owns_trip(trip_id));

CREATE POLICY "trip_shares_delete_own"
  ON public.trip_shares FOR DELETE
  USING (public.user_owns_trip(trip_id));

-- ---------------------------------------------------------------------------
-- trip_collaborators: Besitzprüfung ohne RLS-Loop auf trips
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "trip_collaborators_select" ON public.trip_collaborators;
DROP POLICY IF EXISTS "trip_collaborators_delete_self" ON public.trip_collaborators;
DROP POLICY IF EXISTS "trip_collaborators_delete_owner" ON public.trip_collaborators;

CREATE POLICY "trip_collaborators_select"
  ON public.trip_collaborators FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR public.user_owns_trip(trip_id))
  );

CREATE POLICY "trip_collaborators_delete_self"
  ON public.trip_collaborators FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "trip_collaborators_delete_owner"
  ON public.trip_collaborators FOR DELETE
  USING (public.user_owns_trip(trip_id));
