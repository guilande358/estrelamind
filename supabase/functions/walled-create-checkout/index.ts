import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const API = "https://api.trywalled.com/api/v1/integrations";
const PLAN_ID = "343d0fb2-6e76-4e88-b954-2c901229355f";
const ORIGIN = "https://flowmente.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: u, error } = await sb.auth.getUser(auth.slice(7));
    if (error || !u?.user) return json({ ok: false, error: "unauthorized" }, 401);

    const key = (Deno.env.get("WALLED_API_KEY") || "").trim();
    if (!key) return json({ ok: false, error: "missing_api_key" });

    const attemptId = crypto.randomUUID();
    const customerRef = u.user.id;
    const res = await fetch(`${API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${PLAN_ID}-${customerRef}-${attemptId}`,
      },
      body: JSON.stringify({
        planId: PLAN_ID,
        customerRef,
        successUrl: `${ORIGIN}/billing/success`,
        cancelUrl: `${ORIGIN}/billing/cancel`,
      }),
    });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { /* ignore */ }
    if (!res.ok) {
      console.error("walled checkout error", res.status, text);
      return json({ ok: false, error: data?.error?.message || data?.message || data?.error || `HTTP ${res.status}` });
    }
    const d = data?.data ?? data;
    const url = d?.url || d?.checkoutUrl || d?.checkout_url || d?.session?.url;
    if (!url) {
      console.error("walled checkout: no url", text);
      return json({ ok: false, error: "no_checkout_url" });
    }
    return json({ ok: true, url });
  } catch (e) {
    console.error("walled-create-checkout", e);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
