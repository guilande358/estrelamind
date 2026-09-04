import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useTranslation } from "react-i18next";
import { Mic, PhoneOff, Loader2, Radio } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const ALICE_AGENT_ID = "agent_9401m1nnwgxtf0yt8m5zydk620rd";

interface Line {
  role: "user" | "agent";
  text: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AliceAgentSheetInner = ({ open, onOpenChange }: Props) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [lines, setLines] = useState<Line[]>([]);
  const [connecting, setConnecting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => setConnecting(false),
    onDisconnect: () => setConnecting(false),
    onError: (error: unknown) => {
      setConnecting(false);
      console.error("Alice agent error:", error);
      toast({
        title: t("offload.agentError", { defaultValue: "Erro na chamada com a Alice" }),
        variant: "destructive",
      });
    },
    onMessage: (message: any) => {
      const text: string | undefined =
        message?.message ??
        message?.agent_response_event?.agent_response ??
        message?.user_transcription_event?.user_transcript;
      if (!text) return;
      const source = message?.source ?? (message?.type === "user_transcript" ? "user" : "ai");
      setLines((prev) => [...prev, { role: source === "user" ? "user" : "agent", text }]);
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  const start = useCallback(async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: ALICE_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (e) {
      console.error("Failed to start Alice session:", e);
      setConnecting(false);
      toast({
        title: t("offload.agentMicDenied", {
          defaultValue: "Não foi possível aceder ao microfone",
        }),
        variant: "destructive",
      });
    }
  }, [conversation, t, toast]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.error(e);
    }
  }, [conversation]);

  // End the call when the sheet closes
  useEffect(() => {
    if (!open && isConnected) stop();
    if (!open) setLines([]);
  }, [open, isConnected, stop]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            {t("offload.agentTitle", { defaultValue: "Alice — Assistente de voz" })}
          </SheetTitle>
        </SheetHeader>

        {/* Visualizer */}
        <div className="flex flex-col items-center justify-center py-6">
          <div
            className={cn(
              "w-28 h-28 rounded-full flex items-center justify-center transition-all",
              isConnected ? "gradient-calm shadow-lg" : "bg-muted",
              conversation.isSpeaking && "animate-pulse scale-110"
            )}
          >
            {connecting ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isConnected ? (
              <Radio className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {connecting
              ? t("offload.agentConnecting", { defaultValue: "A ligar..." })
              : isConnected
              ? conversation.isSpeaking
                ? t("offload.agentSpeaking", { defaultValue: "Alice está a falar" })
                : t("offload.agentListening", { defaultValue: "Alice está a ouvir" })
              : t("offload.agentIdle", { defaultValue: "Toque para iniciar a conversa" })}
          </p>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 px-1">
          {lines.map((l, i) => (
            <div key={i} className={cn("flex", l.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  l.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "text-foreground"
                )}
              >
                {l.text}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="pt-3 pb-2">
          {isConnected ? (
            <Button variant="destructive" className="w-full rounded-full" onClick={stop}>
              <PhoneOff className="w-4 h-4 mr-2" />
              {t("offload.agentEnd", { defaultValue: "Terminar chamada" })}
            </Button>
          ) : (
            <Button
              className="w-full rounded-full gradient-calm text-white border-0"
              disabled={connecting}
              onClick={start}
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {t("offload.agentStart", { defaultValue: "Falar com a Alice" })}
            </Button>
          )}
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            {i18n.language.toUpperCase()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const AliceAgentSheet = (props: Props) => (
  <ConversationProvider>
    <AliceAgentSheetInner {...props} />
  </ConversationProvider>
);

export default AliceAgentSheet;
