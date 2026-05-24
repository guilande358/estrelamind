import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Verify Paddle webhook signature (HMAC-SHA256 over `${ts}:${body}`).
// Header format: "ts=<unix>;h1=<hex>"
async function verifyPaddleSignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(';').map((p) => {
      const [k, ...v] = p.split('=');
      return [k.trim(), v.join('=').trim()];
    })
  ) as Record<string, string>;
  const ts = parts['ts'];
  const provided = parts['h1'];
  if (!ts || !provided) return false;

  // Reject signatures older than 5 minutes (replay protection)
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(ts, 10)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}:${rawBody}`));
  const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');

  if (computed.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET');
    if (!PADDLE_WEBHOOK_SECRET) {
      console.error('PADDLE_WEBHOOK_SECRET not configured — rejecting webhook');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('paddle-signature');
    const valid = await verifyPaddleSignature(rawBody, signature, PADDLE_WEBHOOK_SECRET);
    if (!valid) {
      console.warn('Invalid Paddle signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.event_type;
    const data = body.data;

    console.log('Paddle webhook event:', eventType);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (
      eventType === 'subscription.activated' ||
      eventType === 'subscription.updated'
    ) {
      const customerEmail = data.customer?.email;
      const status = data.status;
      const isPremium = status === 'active' || status === 'trialing';

      if (customerEmail) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users?.find((u: any) => u.email === customerEmail);

        if (user) {
          await supabase
            .from('profiles')
            .update({ is_premium: isPremium })
            .eq('user_id', user.id);
          console.log(`Updated premium status for ${customerEmail}: ${isPremium}`);
        }
      }
    }

    if (eventType === 'subscription.canceled') {
      const customerEmail = data.customer?.email;
      if (customerEmail) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users?.find((u: any) => u.email === customerEmail);
        if (user) {
          await supabase
            .from('profiles')
            .update({ is_premium: false })
            .eq('user_id', user.id);
          console.log(`Revoked premium for ${customerEmail}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Paddle webhook error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
