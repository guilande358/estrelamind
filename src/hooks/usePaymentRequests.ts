import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS, type PlanId, type PaymentMethod } from "@/config/payments";

export interface PaymentRequest {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  method: string;
  payer_phone: string;
  transaction_id: string;
  reference: string;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected" | string;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateReference = () => {
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  bytes.forEach((b) => (out += REF_ALPHABET[b % REF_ALPHABET.length]));
  return `MF-${out}`;
};

export interface SubmitPaymentInput {
  plan: PlanId;
  method: PaymentMethod;
  payerPhone: string;
  transactionId: string;
  reference: string;
  proofFile?: File | null;
}

export const usePaymentRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payment-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRequest[];
    },
    enabled: !!user,
  });

  const submit = useMutation({
    mutationFn: async (input: SubmitPaymentInput) => {
      if (!user) throw new Error("Sessão expirada");

      let proofPath: string | null = null;
      if (input.proofFile) {
        const ext = input.proofFile.name.split(".").pop()?.toLowerCase() || "jpg";
        proofPath = `${user.id}/${input.reference}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(proofPath, input.proofFile, { upsert: false });
        if (upErr) throw upErr;
      }

      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          plan: input.plan,
          amount: PLANS[input.plan].amount,
          currency: "MZN",
          method: input.method,
          payer_phone: input.payerPhone.trim(),
          transaction_id: input.transactionId.trim(),
          reference: input.reference,
          proof_url: proofPath,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data as PaymentRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
    },
  });

  const requests = query.data ?? [];
  const pending = requests.find((r) => r.status === "pending") ?? null;
  const lastRejected =
    !pending && requests[0]?.status === "rejected" ? requests[0] : null;

  return { ...query, requests, pending, lastRejected, submit };
};
