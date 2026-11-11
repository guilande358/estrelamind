import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Loader2, Sparkles, Square } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { containsAny, stripTrailingStopWord } from "@/contexts/VoiceCaptureContext";
import { cn } from "@/lib/utils";
import { canUseMicrophone, releaseGlobalStream, stopStream } from "@/lib/audioStreams";

interface Line {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sends the recognised text through the app AI pipeline and returns the reply. */
  onSend: (text: string) => Promise<string | undefined>;
  /** Speaks with the app's voice pipeline (Premium ElevenLabs + native fallback). Resolves when done. */
  onSpeak?: (text: string) => Promise<boolean>;
}

// Wait this long without new speech before assuming the user finished talking.
const SILENCE_MS = 1800;
const STOP_WORDS = ["terminado", "terminei", "pronto", "finalizado", "acabei", "done", "finished", "stop", "listo", "fini"];

/** Requests the real microphone and releases the stream right away. */
const ensureMicrophone = async (): Promise<"ok" | "unsupported" | "notfound" | "denied"> => {
  if (!canUseMicrophone()) return "unsupported";
  try {
    const devices = await navigator.mediaDevices.enumerateDevices?.();
    if (devices && devices.length && !devices.some((d) => d.kind === "audioinput")) return "notfound";
  } catch {
    /* enumerateDevices may fail before permission is granted — ignore */
  }
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return "ok";
  } catch (e: any) {
    if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") return "notfound";
    return "denied";
  } finally {
    stopStream(stream);
    releaseGlobalStream();
  }
};

const VoiceAssistantSheet = ({ open, onOpenChange, onSend, onSpeak }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const recognition = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  const [lines, setLines] = useState<Line[]>([]);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [active, setActive] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef("");
  const busyRef = useRef(false);
  const speakRef = useRef(onSpeak);
  speakRef.current = onSpeak;

  const { transcript, interimTranscript, isListening, isSupported, start, stop, reset } = recognition;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length, thinking]);

  // Everything below describes the *pipeline state*: listening is paused only while
  // Alice is thinking or speaking, so she never talks over the user.
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
          setThinking(false);
          setSpeaking(true);
          const ok = await (speakRef.current ? speakRef.current(reply) : tts.speak(reply));
          if (!ok) setLines((p) => p); // reply stays visible in the chat even without audio
        }
      } catch (e) {
        console.error("voice assistant error", e);
        toast({ title: t("offload.errorProcess"), variant: "destructive" });
      } finally {
        setSpeaking(false);
        setThinking(false);
        busyRef.current = false;
      }
    },
    [onSend, reset, stop, t, toast, tts]
  );

  const end = useCallback(() => {
    setActive(false);
    setGreeted(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    busyRef.current = false;
    setThinking(false);
    setSpeaking(false);
    stop();
    reset();
    tts.stop();
    releaseGlobalStream();
  }, [reset, stop, tts]);

  // Auto-send once the user stops talking (never mid-sentence).
  useEffect(() => {
    if (!open || !active || busyRef.current || thinking || speaking || tts.isSpeaking) return;
    const raw = (transcript || "").trim();
    if (!raw || raw === lastSentRef.current) return;

    const hasStopWord = containsAny(raw, STOP_WORDS);
    const text = hasStopWord ? stripTrailingStopWord(raw) : raw;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (hasStopWord && !text) {
      // User said "done": close this listening session (the sheet itself stays open).
      lastSentRef.current = raw;
      reset();
      end();
      return;
    }

    timerRef.current = setTimeout(() => {
      lastSentRef.current = raw;
      process(hasStopWord ? text : raw);
    }, SILENCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [transcript, interimTranscript, open, active, thinking, speaking, tts.isSpeaking, process, end, reset]);

  // Resume continuous listening whenever Alice is neither thinking nor speaking.
  useEffect(() => {
    if (!open || !active) return;
    if (thinking || speaking || tts.isSpeaking || isListening) return;
    const id = setTimeout(() => start(), 350);
    return () => clearTimeout(id);
  }, [open, active, thinking, speaking, tts.isSpeaking, isListening, start]);

  // Watchdog: mobile browsers drop continuous recognition silently — restart it.
  useEffect(() => {
    if (!open || !active) return;
    const id = setInterval(() => {
      if (!busyRef.current && !thinking && !speaking && !tts.isSpeaking && !isListening) start();
    }, 2500);
    return () => clearInterval(id);
  }, [open, active, thinking, speaking, tts.isSpeaking, isListening, start]);

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
    setActive(true);
    reset();
    if (!greeted) {
      setGreeted(true);
      const greeting = t("offload.aliceGreeting", {
        defaultValue: "Oi! Aqui é a Alice. Pode falar comigo como se eu fosse uma amiga — o que você precisa hoje?",
      });
      setSpeaking(true);
      try {
        await (speakRef.current ? speakRef.current(greeting) : tts.speak(greeting));
      } catch (e) {
        console.error("greeting failed", e);
      } finally {
        setSpeaking(false);
      }
    }
    start();
  }, [requestMic, start, reset, greeted, tts, t]);

  // On open: request the real microphone and start the conversation right away.
  useEffect(() => {
    if (!open) {
      end();
      setLines([]);
      return;
    }
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await begin();
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
    : speaking || tts.isSpeaking
    ? t("offload.assistantSpeaking", { defaultValue: "A responder..." })
    : active && isListening
    ? t("offload.assistantListening", { defaultValue: "A ouvir..." })
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
              ((speaking || tts.isSpeaking) || (active && isListening)) && "animate-pulse scale-105"
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
            {t("offload.assistantHintContinuous", {
              defaultValue: "Fale naturalmente — a Alice responde quando você termina. Toque em Parar para encerrar.",
            })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceAssistantSheet;
