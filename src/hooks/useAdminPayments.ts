import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentRequest } from "@/hooks/usePaymentRequests";

export const useAdminPayments = (status: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-payments", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRequest[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-payments"] });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke(
        "admin-approve-payment",
        { body: { request_id: id } }
      );
      if (error) throw error;
      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) throw new Error(result?.error || "Falha ao aprovar");
      return result;
    },
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          reject_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, approve, reject };
};

export const getProofUrl = async (path: string | null) => {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
};
