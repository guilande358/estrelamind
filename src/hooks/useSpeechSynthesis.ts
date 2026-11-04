import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SpeechSynthesisHook {
  /** Resolves true when the text finished playing, false when it could not play. */
  speak: (text: string) => Promise<boolean>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

// Known female voice names (any language), matched case-insensitively.
const FEMALE_NAMES = [
  'luciana', 'francisca', 'maria', 'joana', 'helena', 'camila', 'letícia', 'leticia',
  'fernanda', 'milena', 'carmit', 'paulina', 'ailís', 'amelie', 'amélie', 'anna',
  'karen', 'moira', 'tessa', 'samantha', 'victoria', 'zira', 'elsa', 'eva', 'female',
];
const MALE_HINTS = ['male', 'homem', 'daniel', 'ricardo', 'jorge', 'thomas', 'diego', 'alex', 'fred', 'rishi'];

/** Splits text into short chunks so long replies never get cut off mid-way. */
const splitChunks = (text: string, max = 180): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?…;:])\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (!s) continue;
    if ((cur ? cur + ' ' + s : s).length <= max) {
      cur = cur ? cur + ' ' + s : s;
      continue;
    }
    if (cur) chunks.push(cur);
    if (s.length <= max) {
      cur = s;
      continue;
    }
    // Very long sentence: split by words
    let piece = '';
    for (const w of s.split(' ')) {
      if ((piece ? piece + ' ' + w : w).length <= max) {
        piece = piece ? piece + ' ' + w : w;
      } else {
        if (piece) chunks.push(piece);
        piece = w;
      }
    }
    cur = piece;
  }
  if (cur) chunks.push(cur);
  return chunks.filter(Boolean);
};

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const { i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const finishRef = useRef<((ok: boolean) => void) | null>(null);
  const cancelledRef = useRef(false);
  const keepAliveRef = useRef<number | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Chrome sometimes needs voices loaded before they can be selected.
  useEffect(() => {
    if (!isSupported) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    const t = window.setTimeout(load, 500);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.clearTimeout(t);
    };
  }, [isSupported]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (!voices.length) return undefined;
    const lang = (i18n.language || 'pt-BR').toLowerCase().replace('_', '-');
    const base = lang.split('-')[0];
    const inLang = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(base));
    const pool = inLang.length ? inLang : voices;
    const female = pool.find((v) => {
      const n = v.name.toLowerCase();
      return FEMALE_NAMES.some((f) => n.includes(f)) && !MALE_HINTS.some((m) => n.includes(m));
    });
    if (female) return female;
    const notMale = pool.find(
      (v) => !MALE_HINTS.some((m) => v.name.toLowerCase().includes(m)) && v.name.toLowerCase() !== 'male'
    );
    return notMale || pool[0];
  }, [voices, i18n.language]);

  const clearKeepAlive = () => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const finish = useCallback((ok: boolean) => {
    const f = finishRef.current;
    finishRef.current = null;
    clearKeepAlive();
    setIsSpeaking(false);
    f?.(ok);
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (isSupported) window.speechSynthesis.cancel();
    finish(false);
  }, [isSupported, finish]);

  // Chrome bug: long speech gets paused after ~15s — a periodic resume keeps it alive.
  const startKeepAlive = () => {
    clearKeepAlive();
    keepAliveRef.current = window.setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
    }, 5000);
  };

  const speak = useCallback(
    (text: string): Promise<boolean> => {
      if (!isSupported || !text.trim()) return Promise.resolve(false);
      stop();
      cancelledRef.current = false;

      const chunks = splitChunks(text);
      const voice = pickVoice();
      const langTag = (i18n.language || 'pt-BR').includes('-') ? i18n.language : `${i18n.language}-BR`;

      return new Promise<boolean>((resolve) => {
        finishRef.current = resolve;
        setIsSpeaking(true);
        startKeepAlive();
        let i = 0;
        const speakNext = () => {
          if (cancelledRef.current || !finishRef.current) return;
          if (i >= chunks.length) {
            finish(true);
            return;
          }
          const u = new SpeechSynthesisUtterance(chunks[i++]);
          u.lang = langTag;
          if (voice) u.voice = voice;
          u.rate = 1;
          u.onend = speakNext;
          u.onerror = () => {
            if (cancelledRef.current) return;
            if (i < chunks.length) speakNext();
            else finish(true);
          };
          window.speechSynthesis.speak(u);
        };
        // Chrome drops the first utterance if spoken right after cancel()
        window.setTimeout(speakNext, 120);
      });
    },
    [isSupported, stop, pickVoice, i18n.language, finish]
  );

  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (isSupported) window.speechSynthesis.cancel();
      clearKeepAlive();
      finishRef.current?.(false);
      finishRef.current = null;
    },
    [isSupported]
  );

  return { speak, stop, isSpeaking, isSupported };
};
