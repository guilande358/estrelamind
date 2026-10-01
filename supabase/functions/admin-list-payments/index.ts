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

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ ok: false, error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const allowed = ['pending', 'approved', 'rejected'];
    const status = allowed.includes(body?.status) ? body.status : 'pending';

    const { data: requests, error: reqErr } = await admin
      .from('payment_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(200);
    if (reqErr) throw reqErr;

    const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];

    const profilesById = new Map<string, string | null>();
    if (userIds.length) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      (profiles ?? []).forEach((p) => profilesById.set(p.user_id, p.display_name));
    }

    const emailsById = new Map<string, string | null>();
    await Promise.all(
      userIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        emailsById.set(id, data?.user?.email ?? null);
      })
    );

    const items = (requests ?? []).map((r) => ({
      ...r,
      payer_name: profilesById.get(r.user_id) ?? null,
      payer_email: emailsById.get(r.user_id) ?? null,
    }));

    return json({ ok: true, items });
  } catch (e) {
    console.error('admin-list-payments error:', e);
    return json({ ok: false, error: 'internal_error' }, 500);
  }
});
