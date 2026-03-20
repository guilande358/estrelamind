import { Crown, Check, Sparkles, Zap, Shield, Volume2, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { usePaddle } from "@/hooks/usePaddle";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

const PREMIUM_MONTHLY_PRICE_ID = "pri_01kjt54b506e1mgs7k17xey4mv";
const PREMIUM_YEARLY_PRICE_ID = "pri_01kjt4zkpq67hspzfke0bdearz";

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
    { icon: Sparkles, text: t("premium.feature1") },
    { icon: Volume2, text: t("premium.feature2") },
    { icon: FileText, text: t("premium.feature3") },
    { icon: Headphones, text: t("premium.feature4") },
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background safe-top">
        <header className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-foreground">{t("premium.title")}</h1>
        </header>
        <div className="px-5 py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{t("premium.isPremiumTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("premium.isPremiumSub")}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate("/perfil")}>
            {t("premium.backToProfile")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top pb-8">
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("premium.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("premium.headline")}</p>
      </header>

      {/* Features */}
      <div className="px-5 py-4 space-y-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-foreground text-sm">{f.text}</p>
                <Check className="w-5 h-5 text-green-500 ml-auto shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans */}
      <div className="px-5 py-4 space-y-3">
        {/* Yearly */}
        <Card
          className="border-2 border-primary cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => openCheckout(PREMIUM_YEARLY_PRICE_ID)}
        >
          <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">
            {t("premium.bestValue")}
          </Badge>
          <CardContent className="p-5 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-lg">{t("premium.yearly")}</p>
                <p className="text-primary text-xs font-medium">{t("premium.yearlySave")}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{t("premium.yearlyEquiv")}</p>
                {t("premium.yearlyLocal") && (
                  <p className="text-muted-foreground text-xs">{t("premium.yearlyLocal")}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{t("premium.yearlyPrice")}</p>
                <p className="text-xs text-muted-foreground">{t("premium.perYear")}</p>
              </div>
            </div>
            <div className="mt-3 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">{t("premium.yearlyTrial")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly */}
        <Card
          className="border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openCheckout(PREMIUM_MONTHLY_PRICE_ID)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-lg">{t("premium.monthly")}</p>
                <p className="text-muted-foreground text-xs">{t("premium.monthlyCancel")}</p>
                {t("premium.monthlyLocal") && (
                  <p className="text-muted-foreground text-xs">{t("premium.monthlyLocal")}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{t("premium.monthlyPrice")}</p>
                <p className="text-xs text-muted-foreground">{t("premium.perMonth")}</p>
              </div>
            </div>
            <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-1.5 text-center">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{t("premium.monthlyTrial")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="px-5 py-2 text-center">
        <p className="text-sm font-medium text-foreground">{t("premium.cta")}</p>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 text-center">
        <p className="text-xs text-muted-foreground">{t("premium.securePayment")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("premium.trialSub")}</p>
      </div>
    </div>
  );
};

export default PremiumPage;
