import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading } = useAuth();

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

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">{t("login.orContinueWith")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 rounded-xl border-border" onClick={() => toast({ title: t("login.comingSoon"), description: t("login.googleSoon") })}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </Button>
          <Button variant="outline" className="h-14 rounded-xl border-border" onClick={() => toast({ title: t("login.comingSoon"), description: t("login.appleSoon") })}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-muted-foreground mt-8">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium">{t("login.createAccount")}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
