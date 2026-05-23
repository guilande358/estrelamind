import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVoiceCapture, STOP_WORDS, containsAny, stripTrailingStopWord } from "@/contexts/VoiceCaptureContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VoiceCaptureOverlay = () => {
  const { isOpen, close, setPendingText } = useVoiceCapture();
  const speech = useSpeechRecognition();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Start microphone visualizer + recognition when opened
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const start = async () => {
      if (!speech.isSupported) {
        toast({ title: t("offload.speechNotSupported"), variant: "destructive" });
        close();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          setLevel(avg);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.error("Mic access denied:", e);
      }
      speech.reset();
      speech.start();
    };
    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Detect "terminado" stop word
  useEffect(() => {
    if (!isOpen) return;
    const live = (speech.transcript + " " + speech.interimTranscript).trim();
    if (!live) return;
    if (containsAny(live, STOP_WORDS)) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, speech.interimTranscript, isOpen]);

  const finish = () => {
    const raw = (speech.transcript + " " + speech.interimTranscript).trim();
    const cleaned = stripTrailingStopWord(raw);
    speech.stop();
    speech.reset();
    close();
    if (cleaned) {
      setPendingText(cleaned);
      if (location.pathname !== "/offload") navigate("/offload");
    }
  };

  const cancel = () => {
    speech.stop();
    speech.reset();
    close();
  };

  if (!isOpen) return null;

  const scale = 1 + level * 0.6;
  const hue = 200 + level * 120; // blue -> green -> violet

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      <button
        onClick={cancel}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
        aria-label={t("offload.cancel")}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        {/* Pulse rings driven by mic level */}
        <div
          className="absolute inset-0 rounded-full transition-transform duration-100"
          style={{
            transform: `scale(${scale})`,
            background: `radial-gradient(circle, hsl(${hue} 80% 60% / 0.35) 0%, hsl(${hue + 40} 70% 50% / 0.15) 60%, transparent 80%)`,
          }}
        />
        <div
          className="absolute inset-4 rounded-full opacity-70 transition-transform duration-150"
          style={{
            transform: `scale(${1 + level * 0.3})`,
            background: `conic-gradient(from 0deg, hsl(${hue} 85% 55%), hsl(${hue + 60} 80% 55%), hsl(${hue + 120} 75% 55%), hsl(${hue} 85% 55%))`,
            filter: "blur(8px)",
          }}
        />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-mindflow-zen flex items-center justify-center shadow-2xl">
          <Mic className="w-12 h-12 text-white" />
        </div>
      </div>

      <p className="mt-8 text-xl font-medium text-foreground">{t("offload.listening")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("offload.sayDone")}</p>

      <div className="mt-6 max-w-md px-6 text-center min-h-[3rem]">
        <p className="text-foreground">{speech.transcript}</p>
        <p className="text-muted-foreground/60 italic">{speech.interimTranscript}</p>
      </div>

      <Button onClick={finish} className="mt-8 gradient-calm text-white border-0 rounded-full px-8">
        {t("offload.done")}
      </Button>
    </div>
  );
};

export default VoiceCaptureOverlay;
