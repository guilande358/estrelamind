import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || '';

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured');

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiFormData = new FormData();
    apiFormData.append('file', audioFile);
    apiFormData.append('model_id', 'scribe_v2');
    apiFormData.append('tag_audio_events', 'false');
    apiFormData.append('diarize', 'false');
    
    // Map language codes for ElevenLabs
    const langMap: Record<string, string> = {
      'pt-BR': 'por',
      'en-US': 'eng',
      'fr-FR': 'fra',
      'es-ES': 'spa',
    };
    if (language && langMap[language]) {
      apiFormData.append('language_code', langMap[language]);
    }

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'STT transcription failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcription = await response.json();

    return new Response(JSON.stringify(transcription), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('STT error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
