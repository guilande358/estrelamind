import { useState } from "react";
import { Briefcase, GraduationCap, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const modeKeys = ["professional", "student", "family"] as const;
const modeIcons = {
  professional: <Briefcase className="w-8 h-8" />,
  student: <GraduationCap className="w-8 h-8" />,
  family: <Users className="w-8 h-8" />,
};

const ModeSelectPage = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (selectedMode && user) {
      await supabase.from("profiles").update({ mode: selectedMode }).eq("user_id", user.id);
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("modeSelect.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("modeSelect.subtitle")}</p>
      </div>

      <div className="flex-1 px-6 space-y-4">
        {modeKeys.map((key) => {
          const features = t(`modeSelect.modes.${key}.features`, { returnObjects: true }) as string[];
          return (
            <Card
              key={key}
              className={`shadow-card border-2 transition-all cursor-pointer touch-feedback ${
                selectedMode === key ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
              }`}
              onClick={() => setSelectedMode(key)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    selectedMode === key ? "gradient-calm text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {modeIcons[key]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{t(`modeSelect.modes.${key}.name`)}</h3>
                      {selectedMode === key && <CheckCircle2 className="w-6 h-6 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{t(`modeSelect.modes.${key}.description`)}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {features.map((feature, index) => (
                        <span key={index} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-6">
        <Button className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl" disabled={!selectedMode} onClick={handleContinue}>
          {t("modeSelect.continue")}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default ModeSelectPage;
