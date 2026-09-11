import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { guestList, guestInsert, guestUpdate, guestDelete } from "@/lib/guestStore";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Expense = Tables<"expenses">;

export const useExpenses = (filters?: { month?: string; paid?: boolean }) => {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["expenses", isGuest ? "guest" : user?.id, filters],
    queryFn: async () => {
      if (isGuest) {
        let rows = guestList<Expense>("expenses");
        if (filters?.month) rows = rows.filter((r) => (r.expense_date || "").startsWith(filters.month!));
        if (filters?.paid !== undefined) rows = rows.filter((r) => !!r.paid === filters.paid);
        return rows.sort((a, b) => (a.expense_date || "").localeCompare(b.expense_date || ""));
      }
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
    enabled: !!user || isGuest,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<TablesInsert<"expenses">, "user_id">) => {
      if (isGuest) {
        return guestInsert<Expense>("expenses", {
          category: "outros",
          currency: "MZN",
          paid: false,
          is_recurring: false,
          expense_date: new Date().toISOString().split("T")[0],
          ...expense,
        });
      }
      const { data, error } = await supabase.from("expenses").insert({ ...expense, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"expenses"> & { id: string }) => {
      if (isGuest) return guestUpdate<Expense>("expenses", id, updates);
      const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) return guestDelete("expenses", id);
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const togglePaid = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      if (isGuest) {
        guestUpdate<Expense>("expenses", id, { paid: !paid });
        return;
      }
      const { error } = await supabase.from("expenses").update({ paid: !paid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, createExpense, updateExpense, deleteExpense, togglePaid };
};
