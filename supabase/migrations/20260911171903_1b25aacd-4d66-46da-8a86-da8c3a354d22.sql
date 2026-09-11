-- 1. Lifetime offload counter
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS offload_used_total integer NOT NULL DEFAULT 0;

-- Seed from existing usage
UPDATE public.profiles SET offload_used_total = COALESCE(offload_count, 0) WHERE offload_used_total = 0;

-- 2. Protect the new column too
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.is_premium := OLD.is_premium;
    NEW.premium_until := OLD.premium_until;
    NEW.offload_count := OLD.offload_count;
    NEW.offload_used_total := OLD.offload_used_total;
    NEW.login_count := OLD.login_count;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Lifetime quota of 5 offload messages
CREATE OR REPLACE FUNCTION public.consume_offload_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  SELECT is_premium, premium_until, offload_used_total
    INTO v_is_premium, v_premium_until, v_used
  FROM public.profiles
  WHERE user_id = v_uid;

  IF COALESCE(v_is_premium, false) = true AND COALESCE(v_premium_until, now() + interval '1 day') > now() THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'premium', true);
  END IF;

  IF COALESCE(v_used, 0) >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'limit', v_limit, 'reason', 'quota_exceeded');
  END IF;

  UPDATE public.profiles
     SET offload_used_total = COALESCE(offload_used_total, 0) + 1,
         offload_count = COALESCE(offload_count, 0) + 1,
         updated_at = now()
   WHERE user_id = v_uid;

  RETURN jsonb_build_object('allowed', true, 'remaining', v_limit - (COALESCE(v_used, 0) + 1), 'limit', v_limit, 'premium', false);
END;
$function$;

-- 4. tick_login no longer resets the offload quota
CREATE OR REPLACE FUNCTION public.tick_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_login_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.profiles
     SET login_count = COALESCE(login_count, 0) + 1,
         updated_at = now()
   WHERE user_id = v_uid
   RETURNING login_count INTO v_login_count;

  RETURN jsonb_build_object('ok', true, 'reset', false, 'login_count', v_login_count);
END;
$function$;

-- 5. Server-generated random payment references
CREATE OR REPLACE FUNCTION public.gen_payment_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
  attempts integer := 0;
BEGIN
  LOOP
    candidate := 'MF-';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.payment_requests WHERE reference = candidate);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'could not generate unique reference';
    END IF;
  END LOOP;
  RETURN candidate;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.gen_payment_reference() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.force_payment_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.reference := public.gen_payment_reference();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS force_payment_reference ON public.payment_requests;
CREATE TRIGGER force_payment_reference
BEFORE INSERT ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION public.force_payment_reference();

ALTER TABLE public.payment_requests ALTER COLUMN reference SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.payment_requests'::regclass AND conname = 'payment_requests_reference_key'
  ) THEN
    ALTER TABLE public.payment_requests ADD CONSTRAINT payment_requests_reference_key UNIQUE (reference);
  END IF;
END $$;