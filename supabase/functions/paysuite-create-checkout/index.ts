import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prices in MZN
const PLAN_PRICES: Record<string, { amount: number; label: string; days: number }> = {
  monthly: { amount: 299, label: "MindFlow Premium — Mensal", days: 30 },
  yearly: { amount: 2990, label: "MindFlow Premium — Anual", days: 365 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string) || undefined;

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan || "monthly");
    const returnUrl = String(body.return_url || "");
    const trial = Boolean(body.trial);

    const cfg = PLAN_PRICES[plan];
    if (!cfg) return json({ error: "Invalid plan" }, 400);

    const PAYSUITE_API_KEY = Deno.env.get("PAYSUITE_API_KEY");
    if (!PAYSUITE_API_KEY) return json({ error: "Paysuite not configured" }, 500);

    // Reference encodes user_id + plan so webhook can activate the right subscription
    const reference = `${userId}:${plan}:${Date.now()}`;
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/paysuite-webhook`;

    const payload = {
      amount: cfg.amount,
      reference,
      description: cfg.label,
      return_url: returnUrl || undefined,
      callback_url: callbackUrl,
      customer: email ? { email } : undefined,
      metadata: { user_id: userId, plan, trial },
    };

    console.log("[paysuite-create-checkout] creating payment", { plan, userId, amount: cfg.amount });

    const psRes = await fetch("https://paysuite.tech/api/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSUITE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const psBody = await psRes.text();
    if (!psRes.ok) {
      console.error("[paysuite] error", psRes.status, psBody);
      return json({ error: "Paysuite request failed", details: psBody }, 502);
    }

    const parsed = safeJson(psBody);
    // Paysuite response shape may vary; try common fields
    const checkoutUrl =
      parsed?.data?.checkout_url ||
      parsed?.checkout_url ||
      parsed?.data?.url ||
      parsed?.url;

    if (!checkoutUrl) {
      console.error("[paysuite] no checkout_url in response", parsed);
      return json({ error: "Paysuite did not return a checkout URL", raw: parsed }, 502);
    }

    return json({ checkout_url: checkoutUrl, reference });
  } catch (e) {
    console.error("[paysuite-create-checkout] error", e);
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
