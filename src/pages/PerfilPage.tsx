import { User, Bell, Moon, Shield, Crown, ChevronRight, Briefcase, GraduationCap, Users, Globe, LogOut, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { languageFlags, type SupportedLanguage } from "@/i18n";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

const PerfilPage = () => {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const [langDialogOpen, setLangDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile, updateProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const isPremium = profile?.is_premium;
  const currentMode = profile?.mode || "profissional";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleModeChange = (modeId: string) => {
    updateProfile.mutate({ mode: modeId });
  };

  const modes = [
    { id: "profissional", name: t("profile.modes.professional"), icon: Briefcase },
    { id: "estudante", name: t("profile.modes.student"), icon: GraduationCap },
    { id: "familia", name: t("profile.modes.family"), icon: Users },
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
                <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
                <p className="text-muted-foreground text-sm">{email}</p>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mt-2 ${
                  isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Crown className="w-3 h-3" />
                  {isPremium ? "Premium" : t("profile.premium")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <div className="px-5 py-2">
          <Card
            className="shadow-soft border-0 gradient-calm overflow-hidden cursor-pointer"
            onClick={() => navigate("/premium")}
          >
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
      )}

      {/* Mode Selection */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("profile.mode")}</h2>
        <div className="flex gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <Card
                key={mode.id}
                className={`flex-1 shadow-card border-2 transition-all cursor-pointer touch-feedback ${
                  isActive ? "border-primary bg-primary/5" : "border-transparent"
                }`}
                onClick={() => handleModeChange(mode.id)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    isActive ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
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
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Moon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{t("profile.darkTheme")}</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{t("profile.notifications")}</p>
              </div>
              <Switch defaultChecked />
            </div>

            {/* Voice Quality */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{t("profile.voiceQuality")}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPremium ? t("profile.voicePremium") : t("profile.voiceStandard")}
                  </p>
                </div>
              </div>
              {isPremium ? (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">ElevenLabs</span>
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Language */}
            <Dialog open={langDialogOpen} onOpenChange={setLangDialogOpen}>
              <DialogTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t("profile.language")}</p>
                      <p className="text-sm text-muted-foreground">{t(`profile.languages.${currentLanguage}`)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </DialogTrigger>
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

            {/* Privacy */}
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{t("profile.privacy")}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Logout */}
      <div className="px-5 py-4">
        <Button
          variant="outline"
          className="w-full h-14 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair
        </Button>
      </div>

      <div className="px-5 py-4 text-center">
        <p className="text-sm text-muted-foreground">{t("profile.version")}</p>
      </div>
    </div>
  );
};

export default PerfilPage;
