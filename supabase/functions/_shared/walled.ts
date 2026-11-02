import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const WALLED_API = "https://api.trywalled.com/api/v1/integrations";
export const WALLED_PLAN_ID = "343d0fb2-6e76-4e88-b954-2c901229355f";

const pick = (o: any, ...keys: string[]) => {
  for (const k of keys) if (o?.[k] != null) return o[k];
  return undefined;
};

/** Looks up the latest subscription for a user at Walled and syncs premium access. */
export async function syncUserFromWalled(userId: string, subscriptionId?: string) {
  const key = (Deno.env.get("WALLED_API_KEY") || "").trim();
  const url = subscriptionId
    ? `${WALLED_API}/subscriptions/${encodeURIComponent(subscriptionId)}`
    : `${WALLED_API}/subscriptions?customerRef=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const text = await res.text();
  if (!res.ok) {
    console.error("walled lookup", res.status, text);
    return { active: false, status: "lookup_failed" };
  }
  const raw = JSON.parse(text);
  let sub: any = raw?.data ?? raw?.subscription ?? raw;
  if (Array.isArray(sub)) sub = sub[0];
  if (!sub) return { active: false, status: "none" };

  const planId = pick(sub, "planId", "plan_id");
  const env = pick(sub, "environment", "mode");
  const status = String(pick(sub, "status") || "").toLowerCase();
  const ref = pick(sub, "customerRef", "customer_ref");
  if (planId !== WALLED_PLAN_ID || (env && env !== "live") || (ref && ref !== userId)) {
    return { active: false, status: "mismatch" };
  }
  const active = status === "active" || status === "trialing";
  const periodEnd = pick(sub, "currentPeriodEnd", "current_period_end", "trialEnd", "trial_end");
  const until = periodEnd
    ? new Date(periodEnd).toISOString()
    : new Date(Date.now() + 31 * 86400000).toISOString();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (active) {
    await admin.from("profiles").update({ is_premium: true, premium_until: until, updated_at: new Date().toISOString() }).eq("user_id", userId);
  } else if (["canceled", "cancelled", "unpaid", "incomplete_expired", "past_due"].includes(status)) {
    // keep access until the already-paid period ends
    await admin.from("profiles").update({ premium_until: periodEnd ? until : new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
  }
  return { active, status, until, billingSupportUrl: pick(sub, "billingSupportUrl", "billing_support_url") };
}
