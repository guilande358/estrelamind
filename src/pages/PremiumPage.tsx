import { useMemo, useState } from "react";
import { Crown, Check, Sparkles, Volume2, FileText, Headphones, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import PaymentProofSheet from "@/components/premium/PaymentProofSheet";
import { usePaymentRequests, generateReference } from "@/hooks/usePaymentRequests";
import { PAYMENT_ACCOUNTS, type PlanId } from "@/config/payments";

const PremiumPage = () => {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { pending, lastRejected } = usePaymentRequests();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [plan, setPlan] = useState<PlanId>("yearly");
  const reference = useMemo(() => generateReference(), [sheetOpen ? plan : plan]);

  const isPremium =
    profile?.is_premium && (!profile?.premium_until || new Date(profile.premium_until) > new Date());

  const startPlan = (p: PlanId) => {
    setPlan(p);
    setSheetOpen(true);
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

      {/* Plans */}
      {!pending && (
        <div className="px-5 py-4 space-y-3">
          <Card
            className="border-2 border-primary cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => startPlan("yearly")}
          >
            <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">
              {t("premium.bestValue")}
            </Badge>
            <CardContent className="p-5 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-lg">{t("premium.yearly")}</p>
                  <p className="text-primary text-xs font-medium">{t("premium.yearlySave")}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">2.990 MT</p>
                  <p className="text-xs text-muted-foreground">{t("premium.perYear")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => startPlan("monthly")}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground text-lg">{t("premium.monthly")}</p>
                  <p className="text-muted-foreground text-xs">{t("premium.monthlyCancel")}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">299 MT</p>
                  <p className="text-xs text-muted-foreground">{t("premium.perMonth")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How it works */}
      <div className="px-5 py-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="font-semibold text-foreground text-sm mb-2">{t("premium.howTitle")}</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>{t("premium.how1", { mpesa: PAYMENT_ACCOUNTS.mpesa.number, emola: PAYMENT_ACCOUNTS.emola.number })}</li>
              <li>{t("premium.how2")}</li>
              <li>{t("premium.how3")}</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">{t("premium.manualNotice")}</p>
      </div>

      <PaymentProofSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plan={plan}
        reference={reference}
      />
    </div>
  );
};

export default PremiumPage;
