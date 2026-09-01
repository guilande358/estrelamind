-- Move privileged helpers out of the API-exposed schema
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Repoint policies to the private helper
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can view all payment requests" ON public.payment_requests
FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;
CREATE POLICY "Admins can update payment requests" ON public.payment_requests
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Approval runs server-side only (service_role), with explicit admin verification
CREATE OR REPLACE FUNCTION private.approve_payment_request(_request_id uuid, _admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.payment_requests%ROWTYPE;
  v_days integer;
  v_base timestamptz;
BEGIN
  IF NOT private.has_role(_admin_id, 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT * INTO v_req FROM public.payment_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_reviewed');
  END IF;

  v_days := CASE WHEN v_req.plan = 'yearly' THEN 365 ELSE 30 END;

  SELECT GREATEST(COALESCE(premium_until, now()), now()) INTO v_base
  FROM public.profiles WHERE user_id = v_req.user_id;

  UPDATE public.profiles
     SET is_premium = true,
         premium_until = COALESCE(v_base, now()) + (v_days || ' days')::interval,
         offload_count = 0,
         updated_at = now()
   WHERE user_id = v_req.user_id;

  UPDATE public.payment_requests
     SET status = 'approved', reviewed_by = _admin_id, reviewed_at = now(), reject_reason = NULL
   WHERE id = _request_id;

  RETURN jsonb_build_object('ok', true, 'days', v_days);
END;
$$;

REVOKE ALL ON FUNCTION private.approve_payment_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.approve_payment_request(uuid, uuid) TO service_role;

DROP FUNCTION IF EXISTS public.approve_payment_request(uuid);