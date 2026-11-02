import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const BillingReturnPage = ({ success }: { success: boolean }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<"checking" | "active" | "pending">(success ? "checking" : "pending");

  useEffect(() => {
    if (!success) return;
    let tries = 0;
    let stop = false;
    const check = async () => {
      const { data } = await supabase.functions.invoke("walled-sync");
      if (stop) return;
      if (data?.active) {
        setState("active");
        qc.invalidateQueries();
      } else if (++tries < 10) setTimeout(check, 3000);
      else setState("pending");
    };
    check();
    return () => { stop = true; };
  }, [success, qc]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        {!success ? (
          <>
            <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Pagamento cancelado</h1>
            <p className="text-muted-foreground mt-2">Nenhum valor foi cobrado. Pode tentar novamente quando quiser.</p>
          </>
        ) : state === "checking" ? (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-foreground">A confirmar o pagamento…</h1>
            <p className="text-muted-foreground mt-2">Isto leva apenas alguns segundos.</p>
          </>
        ) : state === "active" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Premium ativo!</h1>
            <p className="text-muted-foreground mt-2">Obrigado por assinar o MindFlow Premium.</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Pagamento em processamento</h1>
            <p className="text-muted-foreground mt-2">O Premium será ativado automaticamente assim que for confirmado.</p>
          </>
        )}
        <Button className="mt-6" onClick={() => navigate(success ? "/home" : "/premium")}>
          {success ? "Ir para o início" : "Voltar aos planos"}
        </Button>
      </div>
    </div>
  );
};

export default BillingReturnPage;
