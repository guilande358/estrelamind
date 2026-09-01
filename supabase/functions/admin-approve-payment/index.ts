import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ ok: false, error: 'unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: userData, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !userData?.user) return json({ ok: false, error: 'unauthorized' }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Server-side role check — never trust the client
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ ok: false, error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const requestId = typeof body?.request_id === 'string' ? body.request_id : '';
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(requestId)) return json({ ok: false, error: 'invalid_request_id' }, 400);

    const { data: reqRow, error: reqErr } = await admin
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return json({ ok: false, error: 'not_found' }, 404);
    if (reqRow.status !== 'pending') return json({ ok: false, error: 'already_reviewed' }, 409);

    const days = reqRow.plan === 'yearly' ? 365 : 30;

    const { data: profile } = await admin
      .from('profiles')
      .select('premium_until')
      .eq('user_id', reqRow.user_id)
      .maybeSingle();

    const now = Date.now();
    const base = profile?.premium_until ? new Date(profile.premium_until).getTime() : now;
    const until = new Date(Math.max(base, now) + days * 86400000).toISOString();

    const { error: profErr } = await admin
      .from('profiles')
      .update({
        is_premium: true,
        premium_until: until,
        offload_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', reqRow.user_id);
    if (profErr) throw profErr;

    const { error: updErr } = await admin
      .from('payment_requests')
      .update({
        status: 'approved',
        reviewed_by: userData.user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: null,
      })
      .eq('id', requestId)
      .eq('status', 'pending');
    if (updErr) throw updErr;

    return json({ ok: true, days });
  } catch (e) {
    console.error('admin-approve-payment error:', e);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
});
