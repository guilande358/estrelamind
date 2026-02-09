import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SpeechSynthesisHook {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language || 'pt-BR';

    // Try to find the best voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang === i18n.language) 
      || voices.find(v => v.lang.startsWith(i18n.language.split('-')[0]));
    if (langVoice) {
      utterance.voice = langVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, i18n.language, stop]);

  return { speak, stop, isSpeaking, isSupported };
};
