import { Mic, Send, Sparkles, CheckCircle2, Calendar, CreditCard, Bell, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";

const OffloadPage = () => {
  const [input, setInput] = useState("");
  const { t } = useTranslation();
  const { toast } = useToast();
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  const suggestions = [
    { icon: Bell, text: t("offload.suggestions.reminder"), type: t("offload.types.reminder") },
    { icon: Calendar, text: t("offload.suggestions.event"), type: t("offload.types.event") },
    { icon: CheckCircle2, text: t("offload.suggestions.task"), type: t("offload.types.task") },
    { icon: CreditCard, text: t("offload.suggestions.expense"), type: t("offload.types.expense") },
  ];

  const handleMicClick = () => {
    if (!speech.isSupported) {
      toast({ title: t("offload.speechNotSupported"), variant: "destructive" });
      return;
    }
    if (speech.isListening) {
      speech.stop();
      // Fill input with transcript
      const finalText = (speech.transcript + ' ' + speech.interimTranscript).trim();
      if (finalText) setInput(prev => prev ? prev + ' ' + finalText : finalText);
      speech.reset();
    } else {
      speech.reset();
      speech.start();
    }
  };

  const handleStopListening = () => {
    speech.stop();
    const finalText = (speech.transcript + ' ' + speech.interimTranscript).trim();
    if (finalText) setInput(prev => prev ? prev + ' ' + finalText : finalText);
    speech.reset();
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("offload.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("offload.subtitle")}</p>
      </header>

      <div className="px-5 py-4">
        <Card className="shadow-soft border-0 overflow-hidden">
          <CardContent className="p-4">
            <Textarea
              placeholder={t("offload.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full transition-all duration-300 ${
                  speech.isListening
                    ? "bg-primary text-primary-foreground animate-pulse-soft"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                onClick={handleMicClick}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button size="sm" disabled={!input.trim()} className="gradient-calm text-white border-0">
                <Send className="w-4 h-4 mr-2" />
                {t("offload.process")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm">{t("offload.aiHint")}</span>
        </div>
      </div>

      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("offload.trySaying")}</h2>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <Card
                key={index}
                className="shadow-card border-0 cursor-pointer hover:shadow-soft transition-all duration-200 touch-feedback"
                onClick={() => setInput(suggestion.text)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{suggestion.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("offload.createType", { type: suggestion.type })}
                    </p>
                  </div>
                  {tts.isSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); tts.speak(suggestion.text); }}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Voice Listening Modal */}
      {speech.isListening && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-32 h-32 rounded-full gradient-calm flex items-center justify-center animate-pulse-soft">
            <Mic className="w-12 h-12 text-white" />
          </div>
          <p className="text-xl font-medium text-foreground mt-6">{t("offload.listening")}</p>
          <p className="text-muted-foreground mt-2">{t("offload.speakMind")}</p>
          {/* Live transcript */}
          {(speech.transcript || speech.interimTranscript) && (
            <div className="mt-4 max-w-xs text-center px-4">
              <p className="text-foreground">{speech.transcript}</p>
              <p className="text-muted-foreground/60 italic">{speech.interimTranscript}</p>
            </div>
          )}
          <Button variant="outline" className="mt-8" onClick={handleStopListening}>
            {t("offload.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default OffloadPage;
