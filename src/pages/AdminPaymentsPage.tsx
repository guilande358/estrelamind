import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminPayments, getProofUrl } from "@/hooks/useAdminPayments";
import type { PaymentRequest } from "@/hooks/usePaymentRequests";
import { formatMzn, PAYMENT_ACCOUNTS } from "@/config/payments";

const StatusList = ({ status }: { status: string }) => {
  const { toast } = useToast();
  const { data, isLoading, approve, reject } = useAdminPayments(status);
  const [rejectTarget, setRejectTarget] = useState<PaymentRequest | null>(null);
  const [reason, setReason] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      </div>
    );
  }

  if (!data?.length) {
    return <p className="py-10 text-center text-muted-foreground text-sm">Nenhum pedido aqui.</p>;
  }

  const openProof = async (path: string | null) => {
    const url = await getProofUrl(path);
    if (!url) {
      toast({ title: "Comprovativo indisponível", variant: "destructive" });
      return;
    }
    setProofUrl(url);
  };

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync(id);
      toast({ title: "Premium activado" });
    } catch (e) {
      toast({ title: "Falha ao aprovar", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await reject.mutateAsync({ id: rejectTarget.id, reason: reason.trim() || "Comprovativo inválido" });
      toast({ title: "Pedido rejeitado" });
      setRejectTarget(null);
      setReason("");
    } catch (e) {
      toast({ title: "Falha ao rejeitar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={r.id} className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">
                  {formatMzn(Number(r.amount))} · {r.plan === "yearly" ? "Anual" : "Mensal"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-MZ")}
                </p>
              </div>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                {r.status}
              </Badge>
            </div>

            <dl className="text-sm space-y-1">
              <Field label="Referência" value={r.reference} />
              <Field label="Método" value={PAYMENT_ACCOUNTS[r.method as "mpesa" | "emola"]?.label ?? r.method} />
              <Field label="Telefone" value={r.payer_phone} />
              <Field label="ID transacção" value={r.transaction_id} />
              {r.reject_reason && <Field label="Motivo" value={r.reject_reason} />}
            </dl>

            <div className="flex flex-wrap gap-2">
              {r.proof_url && (
                <Button size="sm" variant="outline" onClick={() => openProof(r.proof_url)}>
                  <ImageIcon className="w-4 h-4 mr-1" /> Comprovativo
                </Button>
              )}
              {r.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approve.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectTarget(r)}>
                    <X className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!proofUrl} onOpenChange={(o) => !o && setProofUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprovativo</DialogTitle>
          </DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Comprovativo de pagamento" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rejeitar pedido</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
            Confirmar rejeição
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium text-foreground text-right break-all">{value}</dd>
  </div>
);

const AdminPaymentsPage = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useUserRole();

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate("/home", { replace: true });
  }, [isLoading, isAdmin, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-top pb-10">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate("/perfil")} aria-label="Voltar">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Pagamentos</h1>
      </header>

      <div className="px-5">
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">Pendentes</TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">Rejeitados</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4"><StatusList status="pending" /></TabsContent>
          <TabsContent value="approved" className="mt-4"><StatusList status="approved" /></TabsContent>
          <TabsContent value="rejected" className="mt-4"><StatusList status="rejected" /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
