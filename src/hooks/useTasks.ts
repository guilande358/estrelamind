import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { guestList, guestInsert, guestUpdate, guestDelete } from "@/lib/guestStore";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;

export const useTasks = (filters?: { dueDate?: string; completed?: boolean }) => {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", isGuest ? "guest" : user?.id, filters],
    queryFn: async () => {
      if (isGuest) {
        let rows = guestList<Task>("tasks");
        if (filters?.dueDate) rows = rows.filter((r) => r.due_date === filters.dueDate);
        if (filters?.completed !== undefined) rows = rows.filter((r) => !!r.completed === filters.completed);
        return rows.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
      }
      let q = supabase.from("tasks").select("*").eq("user_id", user!.id).order("due_date", { ascending: true, nullsFirst: false });
      if (filters?.dueDate) q = q.eq("due_date", filters.dueDate);
      if (filters?.completed !== undefined) q = q.eq("completed", filters.completed);
      const { data, error } = await q;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user || isGuest,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const createTask = useMutation({
    mutationFn: async (task: Omit<TablesInsert<"tasks">, "user_id">) => {
      if (isGuest) {
        return guestInsert<Task>("tasks", { completed: false, priority: "medium", category: "geral", ...task });
      }
      const { data, error } = await supabase.from("tasks").insert({ ...task, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"tasks"> & { id: string }) => {
      if (isGuest) return guestUpdate<Task>("tasks", id, updates);
      const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) return guestDelete("tasks", id);
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (isGuest) {
        guestUpdate<Task>("tasks", id, { completed: !completed });
        return;
      }
      const { error } = await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, createTask, updateTask, deleteTask, toggleTask };
};
