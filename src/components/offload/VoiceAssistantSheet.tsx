import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Loader2, Sparkles, Square } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { STOP_WORDS, containsAny, stripTrailingStopWord } from "@/contexts/VoiceCaptureContext";
import { cn } from "@/lib/utils";

interface Line {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sends the recognised text through the app AI pipeline and returns the reply. */
  onSend: (text: string) => Promise<string | undefined>;
}

const SILENCE_MS = 1600;
const WAKE_WORDS = ["alice", "alise", "alici", "ei alice", "hey alice", "ola alice", "oi alice"];

/** Requests the real microphone and releases the stream right away. */
const ensureMicrophone = async (): Promise<"ok" | "unsupported" | "notfound" | "denied"> => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const devices = await navigator.mediaDevices.enumerateDevices?.();
    if (devices && devices.length && !devices.some((d) => d.kind === "audioinput")) return "notfound";
  } catch {
    /* enumerateDevices may fail before permission is granted — ignore */
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return "ok";
  } catch (e: any) {
    if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") return "notfound";
    return "denied";
  }
};

const VoiceAssistantSheet = ({ open, onOpenChange, onSend }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const recognition = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  const [lines, setLines] = useState<Line[]>([]);
  const [thinking, setThinking] = useState(false);
  const [active, setActive] = useState(false);
  const [waking, setWaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef("");
  const busyRef = useRef(false);

  const { transcript, interimTranscript, isListening, isSupported, start, stop, reset } = recognition;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length, thinking]);

  const process = useCallback(
    async (text: string) => {
      busyRef.current = true;
      stop();
      reset();
      lastSentRef.current = "";
      setLines((p) => [...p, { role: "user", text }]);
      setThinking(true);
      try {
        const reply = await onSend(text);
        if (reply) {
          setLines((p) => [...p, { role: "assistant", text: reply }]);
          tts.speak(reply);
        }
      } catch (e) {
        console.error("voice assistant error", e);
        toast({ title: t("offload.errorProcess"), variant: "destructive" });
      } finally {
        setThinking(false);
        busyRef.current = false;
      }
    },
    [onSend, reset, stop, t, toast, tts]
  );

  const end = useCallback(() => {
    setActive(false);
    setWaking(false);
    stop();
    reset();
    tts.stop();
  }, [reset, stop, tts]);

  // Auto-send after a short silence, or immediately on a stop word
  useEffect(() => {
    if (!open || !active || busyRef.current) return;
    const raw = (transcript || "").trim();
    if (!raw || raw === lastSentRef.current) return;

    const hasStopWord = containsAny(raw, STOP_WORDS);
    const text = hasStopWord ? stripTrailingStopWord(raw) : raw;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (hasStopWord) {
      lastSentRef.current = raw;
      if (text) {
        process(text).finally(() => end());
      } else {
        end();
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      lastSentRef.current = raw;
      process(text);
    }, SILENCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [transcript, interimTranscript, open, active, process, end]);

  // Wake word: while idle, say "Alice" to start talking without touching a button
  useEffect(() => {
    if (!open || active || !waking) return;
    const heard = `${transcript || ""} ${interimTranscript || ""}`;
    if (!heard.trim()) return;
    if (containsAny(heard, WAKE_WORDS)) {
      reset();
      setWaking(false);
      setActive(true);
    }
  }, [transcript, interimTranscript, open, active, waking, reset]);

  // Resume listening once the reply finished speaking
  useEffect(() => {
    if (!open || (!active && !waking)) return;
    if (thinking || tts.isSpeaking || isListening) return;
    const id = setTimeout(() => start(), 400);
    return () => clearTimeout(id);
  }, [open, active, waking, thinking, tts.isSpeaking, isListening, start]);

  const requestMic = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: t("offload.voiceUnsupported", {
          defaultValue: "O seu navegador não suporta reconhecimento de voz",
        }),
        variant: "destructive",
      });
      return false;
    }
    const state = await ensureMicrophone();
    if (state === "ok") return true;
    toast({
      title:
        state === "notfound"
          ? t("offload.micNotFound", { defaultValue: "Nenhum microfone encontrado no dispositivo" })
          : state === "unsupported"
          ? t("offload.micUnsupported", { defaultValue: "Este navegador não permite usar o microfone" })
          : t("offload.micDenied", {
              defaultValue: "Permissão do microfone negada. Autorize nas definições do navegador.",
            }),
      variant: "destructive",
    });
    return false;
  }, [isSupported, t, toast]);

  const begin = useCallback(async () => {
    if (!(await requestMic())) return;
    setWaking(false);
    setActive(true);
    start();
  }, [requestMic, start]);

  // On open: request the real mic and stay in wake-word mode
  useEffect(() => {
    if (!open) {
      end();
      setLines([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const ok = await requestMic();
      if (!cancelled && ok) setWaking(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Release mic and speech when the component unmounts
  useEffect(() => () => end(), [end]);

  const statusText = thinking
    ? t("offload.thinking")
    : tts.isSpeaking
    ? t("offload.assistantSpeaking", { defaultValue: "A responder..." })
    : active && isListening
    ? t("offload.assistantListening", { defaultValue: "A ouvir..." })
    : waking
    ? t("offload.assistantWake", { defaultValue: 'Diga "Alice" para começar' })
    : t("offload.assistantIdle", { defaultValue: "Toque para falar" });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("offload.assistantTitle", { defaultValue: "Alice — Assistente inteligente" })}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <div
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center transition-all",
              active ? "gradient-calm shadow-lg" : "bg-muted",
              (tts.isSpeaking || (active && isListening)) && "animate-pulse scale-105"
            )}
          >
            {thinking ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : active ? (
              <Mic className="w-10 h-10 text-white" />
            ) : (
              <MicOff className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{statusText}</p>
          {active && interimTranscript && (
            <p className="mt-1 text-xs text-muted-foreground italic px-6 text-center">{interimTranscript}</p>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 px-1">
          {lines.map((l, i) => (
            <div key={i} className={cn("flex", l.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  l.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-foreground rounded-bl-sm"
                )}
              >
                {l.text}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 pb-2">
          {active ? (
            <Button variant="destructive" className="w-full rounded-full" onClick={end}>
              <Square className="w-4 h-4 mr-2" />
              {t("offload.assistantStop", { defaultValue: "Parar" })}
            </Button>
          ) : (
            <Button className="w-full rounded-full gradient-calm text-white border-0" onClick={begin}>
              <Mic className="w-4 h-4 mr-2" />
              {t("offload.assistantStart", { defaultValue: "Falar com a Alice" })}
            </Button>
          )}
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            {t("offload.assistantHint", {
              defaultValue:
                'Diga "Alice" para começar, "pode criar..." para criar itens e "terminado" para encerrar.',
            })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceAssistantSheet;
