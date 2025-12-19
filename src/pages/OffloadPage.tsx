import { Mic, Send, Sparkles, CheckCircle2, Calendar, CreditCard, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const OffloadPage = () => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const suggestions = [
    { icon: Bell, text: "Lembra-me de pagar a conta de luz dia 15", type: "lembrete" },
    { icon: Calendar, text: "Reunião com o chefe às 14h na terça", type: "evento" },
    { icon: CheckCircle2, text: "Preciso comprar leite no supermercado", type: "tarefa" },
    { icon: CreditCard, text: "Gastei R$ 50 no almoço hoje", type: "despesa" },
  ];

  const handleMicClick = () => {
    setIsListening(!isListening);
    // Future: Implement speech-to-text
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Offload</h1>
        <p className="text-muted-foreground mt-1">
          Descarregue sua mente. A IA organiza para você.
        </p>
      </header>

      {/* Main Input Area */}
      <div className="px-5 py-4">
        <Card className="shadow-soft border-0 overflow-hidden">
          <CardContent className="p-4">
            <Textarea
              placeholder="O que está na sua mente? Escreva livremente..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full transition-all duration-300 ${
                  isListening
                    ? "bg-primary text-primary-foreground animate-pulse-soft"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
                onClick={handleMicClick}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                disabled={!input.trim()}
                className="gradient-calm text-white border-0"
              >
                <Send className="w-4 h-4 mr-2" />
                Processar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Processing Hint */}
      <div className="px-5 py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm">A IA vai identificar e criar automaticamente</span>
        </div>
      </div>

      {/* Quick Suggestions */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Experimente dizer</h2>
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
                      Criar {suggestion.type}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Voice Listening Modal */}
      {isListening && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-32 h-32 rounded-full gradient-calm flex items-center justify-center animate-pulse-soft">
            <Mic className="w-12 h-12 text-white" />
          </div>
          <p className="text-xl font-medium text-foreground mt-6">Ouvindo...</p>
          <p className="text-muted-foreground mt-2">Fale o que está pensando</p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => setIsListening(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
};

export default OffloadPage;
