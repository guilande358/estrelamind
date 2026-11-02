import { syncUserFromWalled } from "../_shared/walled.ts";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const safeEq = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

async function verify(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => { const i = p.indexOf("="); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }),
  );
  const t = parts.t;
  const sigs = header.split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", k, enc.encode(`${t}.${raw}`)));
  return sigs.some((s) => safeEq(s, expected));
}

const seen = new Set<string>();

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
  const secret = (Deno.env.get("WALLED_WEBHOOK_SECRET") || "").trim();
  if (!secret) {
    console.error("WALLED_WEBHOOK_SECRET not set");
    return new Response("not configured", { status: 500 });
  }
  if (!(await verify(raw, req.headers.get("Walled-Signature"), secret))) {
    return new Response("invalid signature", { status: 401 });
  }
  const evt = JSON.parse(raw);
  if (evt?.id && seen.has(evt.id)) return new Response(JSON.stringify({ received: true, duplicate: true }));
  if (evt?.id) seen.add(evt.id);

  const obj = evt?.data?.object ?? evt?.data ?? {};
  const userId = obj.customerRef ?? obj.customer_ref;
  const subId = obj.id ?? obj.subscriptionId ?? obj.subscription_id;
  console.log("walled event", evt?.type, subId);
  if (typeof userId === "string" && /^[0-9a-f-]{36}$/i.test(userId)) {
    // Never trust the payload alone: confirm with the Walled API (idempotent, safe on retries).
    const r = await syncUserFromWalled(userId, typeof subId === "string" && subId.length < 100 ? subId : undefined);
    console.log("sync result", r.status, r.active);
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
