import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface UseElevenLabsReturn {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  isLoading: boolean;
  stop: () => void;
}

export const useElevenLabs = (): UseElevenLabsReturn => {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      URL.revokeObjectURL(currentAudio.src);
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, [currentAudio]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    stop();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language: i18n.language }),
        }
      );

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (e) {
      console.error('ElevenLabs TTS error:', e);
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, [i18n.language, stop]);

  return { speak, isSpeaking, isLoading, stop };
};
