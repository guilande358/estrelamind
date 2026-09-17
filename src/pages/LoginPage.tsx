import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Brain, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { startGuest } = useGuest();

  if (!loading && user) {
    return <Navigate to="/home" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("login.welcomeBack"), description: t("login.loginSuccess") });
      navigate("/home");
    }
  };

  const enterAsGuest = () => {
    startGuest();
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="flex flex-col items-center pt-12 pb-8 px-8">
        <div className="w-20 h-20 rounded-2xl gradient-calm flex items-center justify-center mb-4">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("login.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("login.subtitle")}</p>
      </div>

      <div className="flex-1 px-6">
        <GoogleSignInButton />

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">{t("login.orContinueWith")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="email" placeholder={t("login.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-12 bg-card border-border rounded-xl" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type={showPassword ? "text" : "password"} placeholder={t("login.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 pr-12 bg-card border-border rounded-xl" required />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary font-medium">{t("login.forgotPassword")}</Link>
          </div>
          <Button type="submit" className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl" disabled={isLoading}>
            {isLoading ? t("login.loading") : t("login.submit")}
          </Button>
        </form>

        <Button variant="ghost" className="w-full h-12 mt-4 text-muted-foreground" onClick={enterAsGuest}>
          <UserRound className="w-4 h-4 mr-2" />
          {t("guest.enter", { defaultValue: "Entrar como visitante" })}
        </Button>
        <p className="text-center text-xs text-muted-foreground px-6">
          {t("guest.enterHint", {
            defaultValue: "Sem conta: os dados ficam só nesta sessão e o Offload fica bloqueado.",
          })}
        </p>

        <p className="text-center text-muted-foreground mt-8">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium">{t("login.createAccount")}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
