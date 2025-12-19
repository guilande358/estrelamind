import { useState } from "react";
import { ChevronRight, Brain, Calendar, Wallet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SlideProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const slides: SlideProps[] = [
  {
    icon: <Brain className="w-16 h-16" />,
    title: "Descarregue a sua mente",
    description: "O MindFlow cuida do resto. Diga adeus ao sobrecarregamento mental.",
  },
  {
    icon: <Calendar className="w-16 h-16" />,
    title: "Agenda inteligente unificada",
    description: "Todos os seus compromissos, eventos e tarefas em um só lugar.",
  },
  {
    icon: <Wallet className="w-16 h-16" />,
    title: "Controle automático de despesas",
    description: "Acompanhe gastos, contas e orçamentos sem esforço.",
  },
  {
    icon: <Sparkles className="w-16 h-16" />,
    title: "IA que aprende com você",
    description: "Lembretes e automações personalizados para sua rotina.",
  },
];

const OnboardingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Skip Button */}
      <div className="flex justify-end p-5">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleSkip}
        >
          Pular
        </Button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in" key={currentSlide}>
        <div className="w-32 h-32 rounded-full gradient-calm flex items-center justify-center text-white mb-8 animate-float">
          {slides[currentSlide].icon}
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">
          {slides[currentSlide].title}
        </h1>
        <p className="text-muted-foreground text-center mt-4 max-w-xs">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Navigation */}
      <div className="p-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "bg-muted-foreground/30"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        {/* Next Button */}
        <Button
          className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Começar" : "Próximo"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;
