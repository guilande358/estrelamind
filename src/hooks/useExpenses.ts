import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Expense = Tables<"expenses">;

export const useExpenses = (filters?: { month?: string; paid?: boolean }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["expenses", user?.id, filters],
    queryFn: async () => {
      let q = supabase.from("expenses").select("*").eq("user_id", user!.id).order("expense_date", { ascending: true });
      if (filters?.month) {
        const start = `${filters.month}-01`;
        const [y, m] = filters.month.split("-").map(Number);
        const end = new Date(y, m, 0).toISOString().split("T")[0];
        q = q.gte("expense_date", start).lte("expense_date", end);
      }
      if (filters?.paid !== undefined) q = q.eq("paid", filters.paid);
      const { data, error } = await q;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<TablesInsert<"expenses">, "user_id">) => {
      const { data, error } = await supabase.from("expenses").insert({ ...expense, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"expenses"> & { id: string }) => {
      const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const { error } = await supabase.from("expenses").update({ paid: !paid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });

  return { ...query, createExpense, updateExpense, deleteExpense, togglePaid };
};
