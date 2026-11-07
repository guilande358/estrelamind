// Lightweight language guesser for spoken replies (pt / en / fr / es).
const WORDS: Record<string, string[]> = {
  pt: ['você', 'não', 'está', 'para', 'uma', 'com', 'que', 'tarefa', 'amanhã', 'obrigad', 'olá', 'oi', 'sim', 'também', 'é', 'ção', 'ões', 'meticais', 'lembrete'],
  es: ['usted', 'está', 'para', 'una', 'con', 'que', 'mañana', 'gracias', 'hola', 'sí', 'también', 'ción', 'tarea', 'ñ', 'qué', 'es'],
  fr: ['vous', 'est', 'pour', 'une', 'avec', 'que', 'demain', 'merci', 'bonjour', 'oui', 'aussi', 'tâche', 'je', 'ç', 'à', 'très', 'les'],
  en: ['you', 'the', 'is', 'for', 'with', 'that', 'tomorrow', 'thanks', 'hello', 'yes', 'also', 'task', 'and', 'your', 'i'],
};

export const detectLang = (text: string, fallback = 'pt'): string => {
  const t = ` ${text.toLowerCase()} `;
  let best = fallback;
  let bestScore = 0;
  for (const [lang, words] of Object.entries(WORDS)) {
    let s = 0;
    for (const w of words) {
      if (w.length <= 2 && /^[a-zà-ú]+$/.test(w)) {
        if (t.includes(` ${w} `)) s++;
      } else if (t.includes(w)) s++;
    }
    if (s > bestScore) {
      bestScore = s;
      best = lang;
    }
  }
  return bestScore >= 2 ? best : fallback;
};

export const LANG_TAGS: Record<string, string> = { pt: 'pt-BR', en: 'en-US', fr: 'fr-FR', es: 'es-ES' };
