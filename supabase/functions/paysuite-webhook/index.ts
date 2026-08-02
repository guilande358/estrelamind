import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-account-id",
};

async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// reference: <uuid sem hífens (32)><M|Y><base36 ts>
function parseReference(reference?: string): { userId?: string; plan: string } {
  if (!reference || reference.length < 33) return { plan: "monthly" };
  const uid32 = reference.slice(0, 32);
  if (!/^[0-9a-f]{32}$/i.test(uid32)) return { plan: "monthly" };
  const userId = `${uid32.slice(0, 8)}-${uid32.slice(8, 12)}-${uid32.slice(12, 16)}-${uid32.slice(16, 20)}-${uid32.slice(20)}`;
  return { userId, plan: reference[32] === "Y" ? "yearly" : "monthly" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    const secret = Deno.env.get("PAYSUITE_WEBHOOK_SECRET");
    const apiKey = Deno.env.get("PAYSUITE_API_KEY");
    const sigHeader = req.headers.get("x-webhook-signature");

    let signatureVerified = false;
    if (secret && sigHeader) {
      const computed = await hmacSha256Hex(rawBody, secret);
      signatureVerified = timingSafeEqual(computed, sigHeader.trim().toLowerCase());
      if (!signatureVerified) {
        console.warn("[paysuite-webhook] invalid signature");
        return json({ error: "Invalid signature" }, 400);
      }
    }

    const body = safeJson(rawBody);
    if (!body) return json({ error: "Invalid body" }, 400);

    const event = String(body.event || "");
    const data = body.data || {};
    const paymentId: string | undefined = data.id;
    const reference: string | undefined = data.reference;

    console.log("[paysuite-webhook]", { event, reference, paymentId, signatureVerified });

    if (event === "payment.failed") {
      console.log("[paysuite-webhook] payment failed:", data.error);
      return json({ received: true });
    }
    if (event !== "payment.success") return json({ received: true, ignored: true });

    const { userId, plan } = parseReference(reference);
    if (!userId) {
      console.warn("[paysuite-webhook] cannot resolve user from reference", reference);
      return json({ received: true });
    }

    // Sem assinatura HMAC verificada: confirmar server-to-server antes de ativar Premium
    if (!signatureVerified) {
      if (!apiKey || !paymentId) {
        console.warn("[paysuite-webhook] cannot verify payment — ignoring");
        return json({ received: true, verified: false });
      }
      const verifyRes = await fetch(`https://paysuite.tech/api/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      const verifyBody = safeJson(await verifyRes.text());
      const status = String(verifyBody?.data?.status || "").toLowerCase();
      const ok = verifyRes.ok && status === "paid";
      console.log("[paysuite-webhook] verification:", verifyRes.status, status, ok);
      if (!ok) return json({ received: true, verified: false });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const days = plan === "yearly" ? 365 : 30;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true, premium_until: until, offload_count: 0 })
      .eq("user_id", userId);
    if (error) {
      console.error("[paysuite-webhook] update err", error);
      return json({ error: "Update failed" }, 500);
    }

    console.log("[paysuite-webhook] premium activated", userId, plan, until);
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
