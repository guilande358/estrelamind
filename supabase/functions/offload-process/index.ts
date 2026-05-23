import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { text, language, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = languageNames[language] || 'Portuguese (Brazil)';
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are MindFlow AI — an autonomous, friendly personal assistant inside a mobile productivity app.

LANGUAGE
- Auto-detect the language actually used by the user from their input.
- Reply in that same language. If unclear or mixed, fall back to ${langName} (${language}).
- Handle Portuguese, English, French, Spanish, and code-switching naturally.

YOU HAVE TWO TOOLS — choose the right one:

1) create_items — when the user describes things to remember/do (tasks, events, expenses, reminders).
   - Be aggressive: if it sounds actionable, extract it.
   - Today is ${today}. Resolve relative dates ("amanhã", "tomorrow", "next Friday", "lunes").
   - Parse currency amounts ("R$ 50", "$20", "50 MZN") into the numeric 'amount'.
   - Always include a short, warm confirmation in 'response' (detected language).

2) answer_report — when the user is ASKING about their data (counts, totals, pending items, today's schedule, unread messages).
   - Use the CONTEXT below to answer concretely with real numbers.
   - Don't create items in this mode.

CONTEXT (live data about the user, use it for report answers):
${JSON.stringify(context || {}, null, 2)}

Always call exactly ONE tool. Never plain text replies.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_items',
              description: 'Extract and create actionable items (tasks, events, expenses, reminders) from the user input.',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['task', 'event', 'expense', 'reminder'] },
                        title: { type: 'string' },
                        date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
                        time: { type: 'string', description: 'HH:MM' },
                        amount: { type: 'number' },
                        category: { type: 'string' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                      },
                      required: ['type', 'title'],
                      additionalProperties: false,
                    },
                  },
                  response: { type: 'string', description: 'Friendly confirmation in the user language.' },
                },
                required: ['items', 'response'],
                additionalProperties: false,
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'answer_report',
              description: 'Answer a question about the user data using the CONTEXT (counts, totals, today schedule, unread, etc).',
              parameters: {
                type: 'object',
                properties: {
                  kind: { type: 'string', enum: ['tasks', 'events', 'expenses', 'notifications', 'mixed'] },
                  response: { type: 'string', description: 'Natural language answer in user language, using concrete numbers from context.' },
                },
                required: ['kind', 'response'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: 'auto',
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const name = toolCall.function.name;
      if (name === 'create_items') {
        return new Response(JSON.stringify({ kind: 'create', items: args.items || [], response: args.response || '' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (name === 'answer_report') {
        return new Response(JSON.stringify({ kind: args.kind || 'report', items: [], response: args.response || '' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const content = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ kind: 'report', items: [], response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Offload process error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
