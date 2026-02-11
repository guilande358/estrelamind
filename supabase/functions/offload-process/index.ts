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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = languageNames[language] || 'Portuguese (Brazil)';

    const systemPrompt = `You are MindFlow AI, a smart personal assistant. 
You MUST respond in ${langName} (language code: ${language}).
Analyze the user's input and identify what they want to create. 
Extract structured data using the provided tools.
Be helpful, concise, and always respond in the user's language.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
              description: 'Extract and create items from the user input. Can create tasks, events, expenses, and reminders.',
              parameters: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['task', 'event', 'expense', 'reminder'] },
                        title: { type: 'string', description: 'Title/description of the item' },
                        date: { type: 'string', description: 'ISO date if applicable (YYYY-MM-DD)' },
                        time: { type: 'string', description: 'Time if applicable (HH:MM)' },
                        amount: { type: 'number', description: 'Amount for expenses' },
                        category: { type: 'string', description: 'Category (work, personal, family, shopping, transport, etc.)' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                      },
                      required: ['type', 'title'],
                      additionalProperties: false,
                    },
                  },
                  response: {
                    type: 'string',
                    description: 'A brief friendly response to the user in their language confirming what was understood',
                  },
                },
                required: ['items', 'response'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'create_items' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: return the message content
    const content = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ items: [], response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Offload process error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
