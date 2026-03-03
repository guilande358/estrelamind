import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
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
      const status = data.status; // active, canceled, past_due, etc.
      const isPremium = status === 'active' || status === 'trialing';

      if (customerEmail) {
        // Find user by email
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
