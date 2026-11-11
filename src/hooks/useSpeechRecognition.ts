import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const langMap: Record<string, string> = {
  'pt-BR': 'pt-BR',
  'en-US': 'en-US',
  'fr-FR': 'fr-FR',
  'es-ES': 'es-ES',
};

const getRecognitionCtor = (): any =>
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
    : null;

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const { i18n } = useTranslation();
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = getRecognitionCtor();
  const isSupported = !!SpeechRecognition;

  /** Detaches handlers and stops/aborts the recognizer, always resetting state. */
  const teardown = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onabort = null;
      try { rec.abort?.(); } catch { /* ignore */ }
      try { rec.stop?.(); } catch { /* ignore */ }
    }
    setIsListening(false);
  }, []);

  const stop = useCallback(() => {
    teardown();
  }, [teardown]);

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      setIsListening(false);
      return;
    }
    teardown();

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
      recognition.lang = langMap[i18n.language] || 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        setTranscript(final);
        setInterimTranscript(interim);
      };

      const finishSession = () => {
        if (recognitionRef.current === recognition) recognitionRef.current = null;
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        if (event?.error !== 'aborted' && event?.error !== 'no-speech') {
          console.error('Speech recognition error:', event?.error);
        }
        finishSession();
      };
      recognition.onend = finishSession;
      recognition.onabort = finishSession;

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('Speech recognition failed to start:', e);
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [SpeechRecognition, i18n.language, teardown]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  return { transcript, interimTranscript, isListening, isSupported, start, stop, reset };
};
