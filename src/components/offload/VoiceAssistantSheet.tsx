import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, Loader2, Sparkles, Square } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
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

const VoiceAssistantSheet = ({ open, onOpenChange, onSend }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const recognition = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  const [lines, setLines] = useState<Line[]>([]);
  const [thinking, setThinking] = useState(false);
  const [active, setActive] = useState(false);
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

  // Auto-send after a short silence
  useEffect(() => {
    if (!open || !active || busyRef.current) return;
    const text = (transcript || "").trim();
    if (!text || text === lastSentRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastSentRef.current = text;
      process(text);
    }, SILENCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [transcript, interimTranscript, open, active, process]);

  // Resume listening once the reply finished speaking
  useEffect(() => {
    if (!open || !active) return;
    if (thinking || tts.isSpeaking || isListening) return;
    const id = setTimeout(() => start(), 400);
    return () => clearTimeout(id);
  }, [open, active, thinking, tts.isSpeaking, isListening, start]);

  const begin = () => {
    if (!isSupported) {
      toast({
        title: t("offload.voiceUnsupported", {
          defaultValue: "O seu navegador não suporta reconhecimento de voz",
        }),
        variant: "destructive",
      });
      return;
    }
    setActive(true);
    start();
  };

  const end = useCallback(() => {
    setActive(false);
    stop();
    reset();
    tts.stop();
  }, [reset, stop, tts]);

  useEffect(() => {
    if (!open) {
      end();
      setLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const statusText = thinking
    ? t("offload.thinking")
    : tts.isSpeaking
    ? t("offload.assistantSpeaking", { defaultValue: "A responder..." })
    : isListening
    ? t("offload.assistantListening", { defaultValue: "A ouvir..." })
    : t("offload.assistantIdle", { defaultValue: "Toque para falar" });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("offload.assistantTitle", { defaultValue: "Nina — Assistente inteligente" })}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <div
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center transition-all",
              active ? "gradient-calm shadow-lg" : "bg-muted",
              (tts.isSpeaking || isListening) && "animate-pulse scale-105"
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
          {interimTranscript && (
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
              {t("offload.assistantStart", { defaultValue: "Falar com a Nina" })}
            </Button>
          )}
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            {t("offload.assistantHint", {
              defaultValue: "Gratuita: voz do dispositivo + IA do MindFlow. Diga \"pode criar...\" para criar itens.",
            })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VoiceAssistantSheet;
