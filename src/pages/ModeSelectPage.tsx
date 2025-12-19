import { useState } from "react";
import { Briefcase, GraduationCap, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ModeOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const modes: ModeOption[] = [
  {
    id: "profissional",
    name: "Profissional",
    description: "Para quem trabalha e precisa organizar reuniões, projetos e prazos",
    icon: <Briefcase className="w-8 h-8" />,
    features: ["Reuniões e projetos", "Prazos e entregas", "Despesas de trabalho"],
  },
  {
    id: "estudante",
    name: "Estudante",
    description: "Para quem estuda e precisa gerenciar aulas, trabalhos e provas",
    icon: <GraduationCap className="w-8 h-8" />,
    features: ["Horários de aulas", "Trabalhos e provas", "Metas de estudo"],
  },
  {
    id: "familia",
    name: "Família",
    description: "Para quem cuida de uma família e precisa coordenar atividades",
    icon: <Users className="w-8 h-8" />,
    features: ["Agenda compartilhada", "Despesas familiares", "Tarefas de casa"],
  },
];

const ModeSelectPage = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedMode) {
      localStorage.setItem("mindflow_mode", selectedMode);
      localStorage.setItem("mindflow_onboarded", "true");
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Como você vai usar o MindFlow?</h1>
        <p className="text-muted-foreground mt-2">
          Escolha um modo para personalizar sua experiência. Você pode mudar depois.
        </p>
      </div>

      {/* Mode Options */}
      <div className="flex-1 px-6 space-y-4">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`shadow-card border-2 transition-all cursor-pointer touch-feedback ${
              selectedMode === mode.id
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-border"
            }`}
            onClick={() => setSelectedMode(mode.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  selectedMode === mode.id
                    ? "gradient-calm text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{mode.name}</h3>
                    {selectedMode === mode.id && (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mode.features.map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      <div className="p-6">
        <Button
          className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl"
          disabled={!selectedMode}
          onClick={handleContinue}
        >
          Continuar
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ModeSelectPage;
