import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Upload, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  PAYMENT_ACCOUNTS,
  PLANS,
  formatMzn,
  type PaymentMethod,
  type PlanId,
} from "@/config/payments";
import { usePaymentRequests } from "@/hooks/usePaymentRequests";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanId;
  reference: string;
}

const PaymentProofSheet = ({ open, onOpenChange, plan, reference }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { submit } = usePaymentRequests();
  const fileRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const amount = PLANS[plan].amount;
  const account = PAYMENT_ACCOUNTS[method];

  const copy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: t("premium.copied") });
  };

  const handleSubmit = async () => {
    if (!phone.trim() || !transactionId.trim()) {
      toast({ title: t("premium.fillAll"), variant: "destructive" });
      return;
    }
    try {
      await submit.mutateAsync({
        plan,
        method,
        payerPhone: phone,
        transactionId,
        reference,
        proofFile: file,
      });
      toast({ title: t("premium.submitted"), description: t("premium.submittedSub") });
      onOpenChange(false);
      setPhone("");
      setTransactionId("");
      setFile(null);
    } catch (err) {
      toast({
        title: t("premium.submitError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>{t("premium.payTitle")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4 pb-8">
          {/* Method picker */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PAYMENT_ACCOUNTS) as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                  method === m
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {PAYMENT_ACCOUNTS[m].label}
              </button>
            ))}
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-muted p-4 space-y-3">
            <Row
              label={t("premium.sendTo")}
              value={`${account.number} (${account.holder})`}
              onCopy={() => copy(account.number)}
            />
            <Row label={t("premium.amount")} value={formatMzn(amount)} onCopy={() => copy(String(amount))} />
            <Row label={t("premium.reference")} value={reference} onCopy={() => copy(reference)} />
            <p className="text-xs text-muted-foreground pt-1">{t("premium.referenceHint")}</p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="pp-phone">{t("premium.payerPhone")}</Label>
              <Input
                id="pp-phone"
                inputMode="tel"
                placeholder="+258 8x xxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pp-tx">{t("premium.transactionId")}</Label>
              <Input
                id="pp-tx"
                placeholder="ex: CI250823.1642.A12345"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("premium.proof")}</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileRef.current?.click()}
              >
                {file ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Upload className="w-4 h-4 mr-2" />}
                {file ? file.name : t("premium.attachProof")}
              </Button>
            </div>
          </div>

          <Button className="w-full h-12" onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("premium.submitProof")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Row = ({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground truncate">{value}</p>
    </div>
    <Button size="icon" variant="ghost" onClick={onCopy} aria-label={`Copiar ${label}`}>
      <Copy className="w-4 h-4" />
    </Button>
  </div>
);

export default PaymentProofSheet;
