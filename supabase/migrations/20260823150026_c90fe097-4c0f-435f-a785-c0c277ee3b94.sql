REVOKE EXECUTE ON FUNCTION public.consume_offload_quota() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_offload_quota() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.tick_login() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.tick_login() TO authenticated;