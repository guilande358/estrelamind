import { Crown, Check, Sparkles, Zap, Shield, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { usePaddle } from "@/hooks/usePaddle";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

const PREMIUM_MONTHLY_PRICE_ID = import.meta.env.VITE_PADDLE_MONTHLY_PRICE_ID || "";
const PREMIUM_YEARLY_PRICE_ID = import.meta.env.VITE_PADDLE_YEARLY_PRICE_ID || "";

const PremiumPage = () => {
  const { t } = useTranslation();
  const paddle = usePaddle();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const isPremium = profile?.is_premium;

  const openCheckout = (priceId: string) => {
    if (!paddle || !priceId) return;
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: user?.email ? { email: user.email } : undefined,
      settings: {
        successUrl: `${window.location.origin}/perfil?upgraded=true`,
      },
    });
  };

  const features = [
    { icon: Sparkles, text: "Automações ilimitadas com IA" },
    { icon: Volume2, text: "Voz premium com ElevenLabs" },
    { icon: Zap, text: "Processamento prioritário" },
    { icon: Shield, text: "Sem anúncios" },
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background safe-top">
        <header className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-foreground">Premium</h1>
        </header>
        <div className="px-5 py-8 text-center">
          <div className="w-20 h-20 rounded-full gradient-calm flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Você é Premium! 🎉</h2>
          <p className="text-muted-foreground mt-2">Aproveite todos os recursos exclusivos.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/perfil")}>
            Voltar ao perfil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Premium</h1>
        <p className="text-muted-foreground mt-1">Desbloqueie todo o poder do MindFlow</p>
      </header>

      {/* Features */}
      <div className="px-5 py-4 space-y-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="shadow-card border-0">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-foreground">{f.text}</p>
                <Check className="w-5 h-5 text-success ml-auto" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans */}
      <div className="px-5 py-4 space-y-3">
        <Card
          className="shadow-soft border-2 border-primary cursor-pointer hover:shadow-elevated transition-all"
          onClick={() => openCheckout(PREMIUM_YEARLY_PRICE_ID)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-lg">Anual</p>
                <p className="text-muted-foreground text-sm">Economize 40%</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">R$ 14,90</p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="shadow-card border-0 cursor-pointer hover:shadow-soft transition-all"
          onClick={() => openCheckout(PREMIUM_MONTHLY_PRICE_ID)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-lg">Mensal</p>
                <p className="text-muted-foreground text-sm">Cancele quando quiser</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">R$ 24,90</p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Pagamento seguro processado pelo Paddle. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
};

export default PremiumPage;
