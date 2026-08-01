import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prices in MZN (Paysuite is MZN-native)
const PLAN_PRICES: Record<string, { amount: number; label: string }> = {
  monthly: { amount: 299, label: "MindFlow Premium - Mensal" },
  yearly: { amount: 2990, label: "MindFlow Premium - Anual" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan || "monthly");
    const returnUrl = typeof body.return_url === "string" ? body.return_url : "";
    const method = ["mpesa", "emola", "credit_card"].includes(String(body.method))
      ? String(body.method)
      : undefined;

    const cfg = PLAN_PRICES[plan];
    if (!cfg) return json({ error: "Invalid plan" }, 400);

    const PAYSUITE_API_KEY = Deno.env.get("PAYSUITE_API_KEY");
    if (!PAYSUITE_API_KEY) return json({ error: "Paysuite not configured" }, 500);

    // reference max 50 chars: uuid without dashes (32) + plan flag + short timestamp
    const uid32 = userId.replace(/-/g, "");
    const planFlag = plan === "yearly" ? "Y" : "M";
    const shortTs = Date.now().toString(36); // ~8 chars
    const reference = `${uid32}${planFlag}${shortTs}`.slice(0, 50);

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/paysuite-webhook`;

    const payload: Record<string, unknown> = {
      amount: cfg.amount.toFixed(2),
      reference,
      description: cfg.label.slice(0, 125),
      callback_url: callbackUrl,
    };
    if (method) payload.method = method;
    if (returnUrl) payload.return_url = returnUrl;

    console.log("[paysuite-create-checkout] creating payment", { plan, userId, reference });

    const psRes = await fetch("https://paysuite.tech/api/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSUITE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const psText = await psRes.text();
    const parsed = safeJson(psText);

    if (!psRes.ok || parsed?.status === "error") {
      console.error("[paysuite] error", psRes.status, psText);
      return json({ error: parsed?.message || "Paysuite request failed" }, 502);
    }

    const checkoutUrl = parsed?.data?.checkout_url;
    if (!checkoutUrl) {
      console.error("[paysuite] no checkout_url", psText);
      return json({ error: "Paysuite did not return a checkout URL" }, 502);
    }

    return json({ checkout_url: checkoutUrl, reference, payment_id: parsed?.data?.id });
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
