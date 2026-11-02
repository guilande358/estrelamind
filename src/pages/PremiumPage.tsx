import { useState } from "react";
import { Crown, Check, Sparkles, Volume2, FileText, Headphones, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import PaymentProofSheet from "@/components/premium/PaymentProofSheet";
import { usePaymentRequests } from "@/hooks/usePaymentRequests";
import { type PlanId } from "@/config/payments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PremiumPage = () => {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { pending, lastRejected } = usePaymentRequests();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [plan, setPlan] = useState<PlanId>("yearly");

  const isPremium =
    profile?.is_premium && (!profile?.premium_until || new Date(profile.premium_until) > new Date());

  const startPlan = (p: PlanId) => {
    setPlan(p);
    setSheetOpen(true);
  };

  const [loading, setLoading] = useState(false);
  const startCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("walled-create-checkout");
      if (error || !data?.ok || !data?.url) {
        toast.error(`Não foi possível abrir o pagamento: ${data?.error || error?.message || "erro"}`);
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
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
          {profile?.premium_until && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("premium.validUntil")} {new Date(profile.premium_until).toLocaleDateString("pt-MZ")}
            </p>
          )}
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

      {/* Pending request */}
      {pending && (
        <div className="px-5 py-3">
          <Card className="border-2 border-primary/40 bg-primary/5">
            <CardContent className="p-4 flex gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{t("premium.pendingTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("premium.pendingSub")}</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {t("premium.reference")}: {pending.reference}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejected */}
      {lastRejected && (
        <div className="px-5 py-3">
          <Card className="border-2 border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex gap-3">
              <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{t("premium.rejectedTitle")}</p>
                <p className="text-sm text-muted-foreground">{lastRejected.reject_reason}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Plan (monthly via Walled) */}
      <div className="px-5 py-4 space-y-3">
        <Card className="border-2 border-primary">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-lg">{t("premium.monthly")}</p>
                <p className="text-muted-foreground text-xs">{t("premium.monthlyCancel")}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">299 MT</p>
                <p className="text-xs text-muted-foreground">{t("premium.perMonth")}</p>
              </div>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={startCheckout} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
              Assinar agora
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">M-Pesa, e-Mola ou cartão</p>
          </CardContent>
        </Card>
        {!pending && (
          <button className="w-full text-xs text-muted-foreground underline" onClick={() => startPlan("monthly")}>
            Prefere enviar comprovativo manual?
          </button>
        )}
      </div>

      <PaymentProofSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plan={plan}
      />
    </div>
  );
};

export default PremiumPage;
