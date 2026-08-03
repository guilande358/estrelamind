import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Preços em MZN (PaySuite é nativo em MZN)
const PLANS: Record<string, { amount: number; label: string }> = {
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

    const cfg = PLANS[plan];
    if (!cfg) return json({ error: "Invalid plan" }, 400);

    const rawKey = Deno.env.get("PAYSUITE_API_KEY") ?? "";
    // remove espaços/quebras e um eventual prefixo "Bearer " colado junto ao token
    const apiKey = rawKey.trim().replace(/\s+/g, "").replace(/^Bearer/i, "");
    if (!apiKey) return json({ error: "PaySuite não configurada" }, 500);

    // reference ≤ 50 chars: <uuid sem hífens (32)><M|Y><timestamp base36>
    const uid32 = userId.replace(/-/g, "");
    const planFlag = plan === "yearly" ? "Y" : "M";
    const reference = `${uid32}${planFlag}${Date.now().toString(36)}`.slice(0, 50);

    const payload: Record<string, unknown> = {
      amount: cfg.amount.toFixed(2),
      reference,
      description: cfg.label.slice(0, 125),
      callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paysuite-webhook`,
    };
    // Sem `method`: o cliente escolhe M-Pesa / e-Mola / cartão no checkout da PaySuite
    if (returnUrl) payload.return_url = returnUrl;

    console.log("[paysuite-create-checkout] creating payment", { plan, userId, reference });

    const res = await fetch("https://paysuite.tech/api/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const parsed = safeJson(text);

    if (!res.ok || parsed?.status === "error") {
      console.error("[paysuite] error", res.status, text);
      // 200 para que o cliente consiga ler a mensagem real da PaySuite
      return json({ error: parsed?.message || "Falha na requisição à PaySuite", provider_status: res.status });
    }

    const checkoutUrl = parsed?.data?.checkout_url;
    if (!checkoutUrl) {
      console.error("[paysuite] no checkout_url", text);
      return json({ error: "PaySuite não retornou uma URL de checkout" });
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
