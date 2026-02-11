import { User, Bell, Moon, Shield, Crown, ChevronRight, Briefcase, GraduationCap, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { languageFlags, type SupportedLanguage } from "@/i18n";
import { useState } from "react";

const PerfilPage = () => {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const [langDialogOpen, setLangDialogOpen] = useState(false);

  const modes = [
    { id: "profissional", name: t("profile.modes.professional"), icon: Briefcase, active: true },
    { id: "estudante", name: t("profile.modes.student"), icon: GraduationCap, active: false },
    { id: "familia", name: t("profile.modes.family"), icon: Users, active: false },
  ];

  const settings = [
    { name: t("profile.notifications"), icon: Bell, type: "toggle" as const, value: true },
    { name: t("profile.darkTheme"), icon: Moon, type: "toggle" as const, value: false },
    { name: t("profile.privacy"), icon: Shield, type: "link" as const },
    { name: t("profile.language"), icon: Globe, type: "language" as const, subtitle: t(`profile.languages.${currentLanguage}`) },
  ];

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setLangDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("profile.title")}</h1>
      </header>

      {/* User Profile */}
      <div className="px-5 py-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-calm flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">João Silva</h2>
                <p className="text-muted-foreground text-sm">joao@email.com</p>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-2">
                  <Crown className="w-3 h-3" />
                  {t("profile.premium")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Banner */}
      <div className="px-5 py-2">
        <Card className="shadow-soft border-0 gradient-calm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-white" />
                <div>
                  <p className="font-semibold text-white">{t("profile.upgradePremium")}</p>
                  <p className="text-sm text-white/80">{t("profile.unlimitedAutomations")}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                {t("profile.viewPlans")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Selection */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("profile.mode")}</h2>
        <div className="flex gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className={`flex-1 shadow-card border-2 transition-all cursor-pointer touch-feedback ${
                  mode.active ? "border-primary bg-primary/5" : "border-transparent"
                }`}
              >
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    mode.active ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${mode.active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-sm font-medium ${mode.active ? "text-primary" : "text-muted-foreground"}`}>
                    {mode.name}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Settings */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("profile.settings")}</h2>
        <Card className="shadow-card border-0">
          <CardContent className="p-0 divide-y divide-border">
            {settings.map((setting, index) => {
              const Icon = setting.icon;
              
              const content = (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{setting.name}</p>
                      {setting.subtitle && (
                        <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                      )}
                    </div>
                  </div>
                  {setting.type === "toggle" ? (
                    <Switch defaultChecked={setting.value} />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              );

              if (setting.type === "language") {
                return (
                  <Dialog key={index} open={langDialogOpen} onOpenChange={setLangDialogOpen}>
                    <DialogTrigger asChild>{content}</DialogTrigger>
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{t("profile.language")}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        {supportedLanguages.map((lang) => (
                          <button
                            key={lang}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                              currentLanguage === lang ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            }`}
                            onClick={() => handleLanguageChange(lang as SupportedLanguage)}
                          >
                            <span className="text-2xl">{languageFlags[lang as SupportedLanguage]}</span>
                            <span className="font-medium">{t(`profile.languages.${lang}`)}</span>
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              }

              return content;
            })}
          </CardContent>
        </Card>
      </section>

      <div className="px-5 py-4 text-center">
        <p className="text-sm text-muted-foreground">{t("profile.version")}</p>
      </div>
    </div>
  );
};

export default PerfilPage;
