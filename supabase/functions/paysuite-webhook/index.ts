import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paysuite-signature",
};

async function verifySignature(rawBody: string, sigHeader: string | null, secret: string): Promise<boolean> {
  if (!sigHeader || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  // constant-time compare
  if (computed.length !== sigHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ sigHeader.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const secret = Deno.env.get("PAYSUITE_WEBHOOK_SECRET");
    const sigHeader = req.headers.get("x-paysuite-signature") || req.headers.get("x-signature");

    // Only enforce signature check if a secret is configured (allows Paysuite dashboards without HMAC to still work)
    if (secret) {
      const ok = await verifySignature(rawBody, sigHeader, secret);
      if (!ok) {
        console.warn("[paysuite-webhook] invalid signature");
        return json({ error: "Invalid signature" }, 400);
      }
    }

    const body = safeJson(rawBody);
    if (!body) return json({ error: "Invalid body" }, 400);

    const event = body.event || body.type || body.status;
    const data = body.data || body;
    const reference: string | undefined = data.reference || data.metadata?.reference || body.reference;
    const metadata = data.metadata || body.metadata || {};

    console.log("[paysuite-webhook] event:", event, "reference:", reference);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Parse reference "userId:plan:ts" (fallback to metadata.user_id)
    let userId = metadata.user_id as string | undefined;
    let plan = (metadata.plan as string) || "monthly";
    if (reference && reference.includes(":")) {
      const parts = reference.split(":");
      if (!userId) userId = parts[0];
      if (parts[1]) plan = parts[1];
    }

    if (!userId) {
      console.warn("[paysuite-webhook] no user_id, ignoring");
      return json({ received: true });
    }

    const success = ["payment.success", "success", "completed", "paid"].includes(String(event));
    const failed = ["payment.failed", "failed", "cancelled"].includes(String(event));

    if (success) {
      const days = plan === "yearly" ? 365 : 30;
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({ is_premium: true, premium_until: until, offload_count: 0 })
        .eq("user_id", userId);
      if (error) console.error("[paysuite-webhook] update err", error);
      console.log("[paysuite-webhook] activated premium", userId, "until", until);
    } else if (failed) {
      console.log("[paysuite-webhook] payment failed for", userId, "— no changes");
    }

    return json({ received: true });
  } catch (e) {
    console.error("[paysuite-webhook] error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
