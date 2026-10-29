-- Einladung per E-Mail (ohne Link kopieren)
-- Im Supabase SQL Editor ausführen (gesamte Datei).
-- Voraussetzung: 20260821130000_fix_trips_rls_recursion.sql (user_owns_trip etc.)

CREATE TABLE IF NOT EXISTS public.trip_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (trip_id, email)
);

CREATE INDEX IF NOT EXISTS idx_trip_invites_email
  ON public.trip_invites (lower(email))
  WHERE accepted_at IS NULL;

ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_invites_select_owner" ON public.trip_invites;
DROP POLICY IF EXISTS "trip_invites_insert_owner" ON public.trip_invites;
DROP POLICY IF EXISTS "trip_invites_delete_owner" ON public.trip_invites;

CREATE POLICY "trip_invites_select_owner"
  ON public.trip_invites FOR SELECT
  USING (public.user_owns_trip(trip_id));

CREATE POLICY "trip_invites_insert_owner"
  ON public.trip_invites FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND invited_by = auth.uid()
    AND public.user_owns_trip(trip_id)
  );

CREATE POLICY "trip_invites_delete_owner"
  ON public.trip_invites FOR DELETE
  USING (public.user_owns_trip(trip_id));

REVOKE ALL ON public.trip_invites FROM PUBLIC;
REVOKE ALL ON public.trip_invites FROM anon;
GRANT SELECT, INSERT, DELETE ON public.trip_invites TO authenticated;
GRANT ALL ON public.trip_invites TO service_role;

-- Einladen: wenn User schon existiert → sofort Collaborator; sonst Pending-Invite
CREATE OR REPLACE FUNCTION public.invite_trip_by_email(
  p_trip_id text,
  p_email text,
  p_role text DEFAULT 'editor'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_role text;
  v_uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  IF NOT public.user_owns_trip(p_trip_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_owner');
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' OR position('@' in v_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  v_role := CASE WHEN p_role = 'viewer' THEN 'viewer' ELSE 'editor' END;

  IF EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND lower(u.email) = v_email
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self');
  END IF;

  SELECT u.id INTO v_uid
  FROM auth.users u
  WHERE lower(u.email) = v_email
  LIMIT 1;

  IF v_uid IS NOT NULL THEN
    INSERT INTO public.trip_collaborators (trip_id, user_id, role, share_id)
    VALUES (p_trip_id, v_uid, v_role, NULL)
    ON CONFLICT (trip_id, user_id) DO UPDATE
      SET role = EXCLUDED.role;

    INSERT INTO public.trip_invites (trip_id, email, role, invited_by, accepted_at)
    VALUES (p_trip_id, v_email, v_role, auth.uid(), NOW())
    ON CONFLICT (trip_id, email) DO UPDATE
      SET role = EXCLUDED.role,
          accepted_at = NOW(),
          invited_by = EXCLUDED.invited_by;

    RETURN jsonb_build_object('ok', true, 'status', 'added', 'email', v_email, 'role', v_role);
  END IF;

  INSERT INTO public.trip_invites (trip_id, email, role, invited_by, accepted_at)
  VALUES (p_trip_id, v_email, v_role, auth.uid(), NULL)
  ON CONFLICT (trip_id, email) DO UPDATE
    SET role = EXCLUDED.role,
        accepted_at = NULL,
        invited_by = EXCLUDED.invited_by;

  RETURN jsonb_build_object('ok', true, 'status', 'pending', 'email', v_email, 'role', v_role);
END;
$$;

-- Beim Login: offene Einladungen für die eigene E-Mail übernehmen
CREATE OR REPLACE FUNCTION public.claim_trip_invites()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_count int := 0;
  r record;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth_required');
  END IF;

  SELECT lower(u.email) INTO v_email
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('ok', true, 'claimed', 0);
  END IF;

  FOR r IN
    SELECT id, trip_id, role
    FROM public.trip_invites
    WHERE lower(email) = v_email
      AND accepted_at IS NULL
  LOOP
    INSERT INTO public.trip_collaborators (trip_id, user_id, role, share_id)
    VALUES (r.trip_id, auth.uid(), r.role, NULL)
    ON CONFLICT (trip_id, user_id) DO UPDATE
      SET role = EXCLUDED.role;

    UPDATE public.trip_invites
    SET accepted_at = NOW()
    WHERE id = r.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'claimed', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.invite_trip_by_email(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_trip_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_trip_by_email(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_trip_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_trip_by_email(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_trip_invites() TO service_role;
