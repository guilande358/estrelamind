import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncUserFromWalled } from "../_shared/walled.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ ok: false }, 401);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: u, error } = await sb.auth.getUser(auth.slice(7));
  if (error || !u?.user) return json({ ok: false }, 401);
  try {
    const r = await syncUserFromWalled(u.user.id);
    return json({ ok: true, ...r });
  } catch (e) {
    console.error("walled-sync", e);
    return json({ ok: false, error: "internal_error" });
  }
});
