import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface VoiceCaptureContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  pendingText: string | null;
  consumePendingText: () => string | null;
  setPendingText: (text: string) => void;
}

const VoiceCaptureContext = createContext<VoiceCaptureContextValue | null>(null);

export const VoiceCaptureProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingText, setPending] = useState<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const setPendingText = useCallback((t: string) => setPending(t), []);
  const consumePendingText = useCallback(() => {
    const t = pendingText;
    setPending(null);
    return t;
  }, [pendingText]);

  return (
    <VoiceCaptureContext.Provider value={{ isOpen, open, close, pendingText, setPendingText, consumePendingText }}>
      {children}
    </VoiceCaptureContext.Provider>
  );
};

export const useVoiceCapture = () => {
  const ctx = useContext(VoiceCaptureContext);
  if (!ctx) throw new Error("useVoiceCapture must be used within VoiceCaptureProvider");
  return ctx;
};

// Multi-language stop words to end the voice capture
export const STOP_WORDS = [
  "terminado", "terminei", "terminamos", "pronto", "prontinho", "finalizar", "finalizado", "acabei", "acabou", "acabado",
  "done", "finished", "finish", "stop", "that's all", "thats all", "im done", "i'm done",
  "terminé", "fini", "c'est fini", "j'ai fini",
  "listo", "terminado", "acabado", "ya está", "ya esta", "he terminado",
];

// Auto-create triggers
export const AUTO_CREATE_WORDS = [
  "pode criar", "cria isso", "cria pra mim", "crie", "criar", "pode adicionar", "adiciona", "salva",
  "create it", "go ahead", "please create", "add it", "save it",
  "créalo", "crea eso", "guárdalo", "guardalo",
  "crée-le", "crée ça", "ajoute", "enregistre",
];

export const containsAny = (text: string, words: string[]) => {
  const t = " " + text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " ";
  return words.some((w) => t.includes(" " + w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " ") ||
    t.includes(" " + w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
};

export const stripTrailingStopWord = (text: string) => {
  let t = text.trim();
  for (const w of STOP_WORDS) {
    const re = new RegExp("[\\s,\\.!]*" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s,\\.!]*$", "i");
    t = t.replace(re, "");
  }
  return t.trim();
};
