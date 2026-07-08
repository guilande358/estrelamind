-- Add premium/quota columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS offload_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Consume one offload quota unit; returns allowed + remaining
CREATE OR REPLACE FUNCTION public.consume_offload_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_premium boolean;
  v_premium_until timestamptz;
  v_count integer;
  v_limit constant integer := 5;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'unauthenticated');
  END IF;

  SELECT is_premium, premium_until, offload_count
    INTO v_is_premium, v_premium_until, v_count
  FROM public.profiles
  WHERE user_id = v_uid;

  -- Premium ativo = ilimitado
  IF COALESCE(v_is_premium, false) = true AND COALESCE(v_premium_until, now() + interval '1 day') > now() THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'premium', true);
  END IF;

  IF COALESCE(v_count, 0) >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'quota_exceeded');
  END IF;

  UPDATE public.profiles
     SET offload_count = COALESCE(offload_count, 0) + 1,
         updated_at = now()
   WHERE user_id = v_uid;

  RETURN jsonb_build_object('allowed', true, 'remaining', v_limit - (COALESCE(v_count, 0) + 1), 'premium', false);
END;
$$;

-- Register a login; every 5 logins the offload quota resets
CREATE OR REPLACE FUNCTION public.tick_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_login_count integer;
  v_cycle constant integer := 5;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.profiles
     SET login_count = COALESCE(login_count, 0) + 1,
         updated_at = now()
   WHERE user_id = v_uid
   RETURNING login_count INTO v_login_count;

  IF v_login_count IS NOT NULL AND v_login_count >= v_cycle THEN
    UPDATE public.profiles
       SET login_count = 0,
           offload_count = 0,
           updated_at = now()
     WHERE user_id = v_uid;
    RETURN jsonb_build_object('ok', true, 'reset', true);
  END IF;

  RETURN jsonb_build_object('ok', true, 'reset', false, 'login_count', v_login_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_offload_quota() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tick_login() TO authenticated;