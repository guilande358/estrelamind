import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface UseElevenLabsReturn {
  /** Resolves true if audio played, false if it failed (caller should fall back). */
  speak: (text: string) => Promise<boolean>;
  isSpeaking: boolean;
  isLoading: boolean;
  stop: () => void;
}

export const useElevenLabs = (): UseElevenLabsReturn => {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      URL.revokeObjectURL(a.src);
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false;
    stop();
    setIsLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) throw new Error('no session');
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text, language: i18n.language }),
        }
      );
      if (!response.ok) throw new Error(`TTS failed ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('empty audio');
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onplay = () => { setIsSpeaking(true); setIsLoading(false); };
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); setIsLoading(false); URL.revokeObjectURL(url); };
      audioRef.current = audio;
      await audio.play();
      return true;
    } catch (e) {
      console.warn('ElevenLabs TTS unavailable, falling back:', e);
      setIsLoading(false);
      setIsSpeaking(false);
      return false;
    }
  }, [i18n.language, stop]);

  return { speak, isSpeaking, isLoading, stop };
};
