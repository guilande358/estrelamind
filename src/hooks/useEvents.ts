import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuest } from "@/contexts/GuestContext";
import { guestList, guestInsert, guestUpdate, guestDelete } from "@/lib/guestStore";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Event = Tables<"events">;

export const useEvents = (filters?: { date?: string }) => {
  const { user } = useAuth();
  const { isGuest } = useGuest();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["events", isGuest ? "guest" : user?.id, filters],
    queryFn: async () => {
      if (isGuest) {
        let rows = guestList<Event>("events");
        if (filters?.date) rows = rows.filter((r) => (r.start_date || "").slice(0, 10) === filters.date);
        return rows.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
      }
      let q = supabase.from("events").select("*").eq("user_id", user!.id).order("start_date", { ascending: true });
      if (filters?.date) {
        const dayStart = `${filters.date}T00:00:00`;
        const dayEnd = `${filters.date}T23:59:59`;
        q = q.gte("start_date", dayStart).lte("start_date", dayEnd);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user || isGuest,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events"] });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<TablesInsert<"events">, "user_id">) => {
      if (isGuest) return guestInsert<Event>("events", { category: "geral", reminder_minutes: 30, ...event });
      const { data, error } = await supabase.from("events").insert({ ...event, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"events"> & { id: string }) => {
      if (isGuest) return guestUpdate<Event>("events", id, updates);
      const { data, error } = await supabase.from("events").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) return guestDelete("events", id);
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, createEvent, updateEvent, deleteEvent };
};
