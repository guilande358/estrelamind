CREATE OR REPLACE FUNCTION public.consume_offload_quota()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_premium boolean;
  v_premium_until timestamptz;
  v_used integer;
  v_limit constant integer := 5;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'unauthenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin') THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'premium', true, 'admin', true);
  END IF;

  SELECT is_premium, premium_until, offload_used_total INTO v_is_premium, v_premium_until, v_used
  FROM public.profiles WHERE user_id = v_uid;

  IF COALESCE(v_is_premium, false) = true AND COALESCE(v_premium_until, now() + interval '1 day') > now() THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'premium', true);
  END IF;

  IF COALESCE(v_used, 0) >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'limit', v_limit, 'reason', 'quota_exceeded');
  END IF;

  UPDATE public.profiles SET offload_used_total = COALESCE(offload_used_total, 0) + 1,
         offload_count = COALESCE(offload_count, 0) + 1, updated_at = now()
   WHERE user_id = v_uid;

  RETURN jsonb_build_object('allowed', true, 'remaining', v_limit - (COALESCE(v_used, 0) + 1), 'limit', v_limit, 'premium', false);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.consume_offload_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_offload_quota() TO authenticated;

UPDATE public.profiles p SET is_premium = true, premium_until = NULL
FROM public.user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin';