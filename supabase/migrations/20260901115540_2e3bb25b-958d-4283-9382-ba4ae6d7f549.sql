REVOKE ALL ON FUNCTION public.tick_login() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_offload_quota() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;