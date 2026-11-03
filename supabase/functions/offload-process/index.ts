import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const languageNames: Record<string, string> = {
  'pt-BR': 'Portuguese (Brazil)',
  'en-US': 'English',
  'fr-FR': 'French',
  'es-ES': 'Spanish',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user to prevent anonymous abuse of paid AI quota
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text, history, userName, language, context, localDate, localTime, timeZone, weekday } = await req.json();
    const safeHistory = (Array.isArray(history) ? history : [])
      .slice(-10)
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content.slice(0, 1500) }));
    const safeName = typeof userName === 'string' ? userName.replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 60) : '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = languageNames[language] || 'Portuguese (Brazil)';
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    const isoTime = /^\d{2}:\d{2}$/;
    const today = isoDate.test(localDate ?? '') ? localDate : new Date().toISOString().split('T')[0];
    const nowTime = isoTime.test(localTime ?? '') ? localTime : '';

    const systemPrompt = `You are MindFlow AI — an autonomous, friendly personal assistant inside a mobile productivity app.

LANGUAGE
- Auto-detect the language actually used by the user from their input.
- Reply in that same language. If unclear or mixed, fall back to ${langName} (${language}).
- Handle Portuguese, English, French, Spanish, and code-switching naturally.

Your name is Alice. Decide the mode:

1) "create" — the user describes things to remember/do (tasks, events, expenses, reminders).
   - The user's local date is ${today}${weekday ? ` (${weekday})` : ''}, local time ${nowTime || 'unknown'}${timeZone ? `, timezone ${timeZone}` : ''}. Resolve relative dates/times against this local date and time, never UTC.
   - 'date' strictly YYYY-MM-DD. 'time' strictly HH:MM 24h.
   - If a field is not mentioned, OMIT it.
   - Parse amounts into a positive number. For income ("recebi", "ganhei"), use type='expense' with NEGATIVE amount.
   - Expense category one of: alimentacao, transporte, moradia, saude, educacao, lazer, compras, outros.

2) "report" — the user asks about their data, or just chats. Use CONTEXT for concrete numbers. items = [].

CONTEXT:
${JSON.stringify(context || {}, null, 2)}

Reply ONLY with valid JSON, no markdown:
{"mode":"create"|"report","response":"short friendly reply in user's language","items":[{"type":"task|event|expense|reminder","title":"...","date":"YYYY-MM-DD","time":"HH:MM","amount":0,"category":"...","priority":"low|medium|high"}]}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt + (safeName ? `\n\nThe user's name is ${safeName}.` : '') +
            `\n\nMEMORY: Earlier turns of this conversation are included below. Use them to understand short replies like "sim", "faz isso", "e depois?". Never greet again or restart the conversation if there is history.` },
          ...safeHistory,
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI processing failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || '';
    let parsed: any = null;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : content);
    } catch (_) { parsed = null; }

    if (!parsed) {
      return new Response(JSON.stringify({ kind: 'report', items: [], response: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const items = Array.isArray(parsed.items) ? parsed.items.filter((i: any) => i && i.title && i.type) : [];
    const kind = parsed.mode === 'create' && items.length ? 'create' : 'report';
    return new Response(JSON.stringify({ kind, items: kind === 'create' ? items : [], response: String(parsed.response || '') }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Offload process error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
