import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    setIsLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: t("register.accountCreated"),
        description: "Verifique seu e-mail para confirmar a conta.",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      <div className="flex items-center p-5">
        <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center pb-8 px-8">
        <div className="w-16 h-16 rounded-2xl gradient-calm flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("register.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("register.subtitle")}</p>
      </div>

      <div className="flex-1 px-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="text" placeholder={t("register.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-14 pl-12 bg-card border-border rounded-xl" required />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="email" placeholder={t("register.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-12 bg-card border-border rounded-xl" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type={showPassword ? "text" : "password"} placeholder={t("register.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 pr-12 bg-card border-border rounded-xl" required minLength={6} />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{t("register.minChars")}</p>
          <Button type="submit" className="w-full h-14 text-lg font-medium gradient-calm text-white border-0 rounded-xl" disabled={isLoading}>
            {isLoading ? t("register.loading") : t("register.submit")}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          {t("register.terms")}{" "}
          <a href="#" className="text-primary">{t("register.termsOfUse")}</a> {t("register.and")}{" "}
          <a href="#" className="text-primary">{t("register.privacyPolicy")}</a>.
        </p>

        <p className="text-center text-muted-foreground mt-8">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="text-primary font-medium">{t("register.login")}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
