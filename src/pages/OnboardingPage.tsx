import { useState } from "react";
import { ChevronRight, Brain, Calendar, Wallet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const slideKeys = ["mind", "agenda", "expenses", "ai"] as const;
const slideIcons = [
  <Brain className="w-16 h-16" key="brain" />,
  <Calendar className="w-16 h-16" key="calendar" />,
  <Wallet className="w-16 h-16" key="wallet" />,
  <Sparkles className="w-16 h-16" key="sparkles" />,
];

const OnboardingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentSlide < slideKeys.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="flex justify-end p-5">
        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate("/login")}>
          {t("onboarding.skip")}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 animate-fade-in" key={currentSlide}>
        <div className="w-32 h-32 rounded-full gradient-calm flex items-center justify-center text-white mb-8 animate-float">
          {slideIcons[currentSlide]}
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center">
          {t(`onboarding.slides.${slideKeys[currentSlide]}.title`)}
        </h1>
        <p className="text-muted-foreground text-center mt-4 max-w-xs">
          {t(`onboarding.slides.${slideKeys[currentSlide]}.description`)}
        </p>
      </div>

      <div className="p-8">
        <div className="flex justify-center gap-2 mb-8">
          {slideKeys.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-primary" : "bg-muted-foreground/30"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <Button
          className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl"
          onClick={handleNext}
        >
          {currentSlide === slideKeys.length - 1 ? t("onboarding.start") : t("onboarding.next")}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;
