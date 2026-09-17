import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, Loader2, Volume2, VolumeX, Mic, CheckCircle2, Calendar, CreditCard, Bell, Lock, Crown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useElevenLabs } from "@/hooks/useElevenLabs";
import { useProfile } from "@/hooks/useProfile";
import { useTasks } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useVoiceCapture, AUTO_CREATE_WORDS, containsAny } from "@/contexts/VoiceCaptureContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmationCard, { type AIItem } from "@/components/offload/ConfirmationCard";

import VoiceAssistantSheet from "@/components/offload/VoiceAssistantSheet";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useGuest } from "@/contexts/GuestContext";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 5;

type Role = "user" | "assistant";
interface DbMessage {
  id: string;
  role: Role;
  content: string;
  items: AIItem[] | null;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  task: CheckCircle2,
  event: Calendar,
  expense: CreditCard,
  reminder: Bell,
};

const OffloadPage = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const tts = useSpeechSynthesis();
  const elevenLabs = useElevenLabs();
  const { createTask } = useTasks();
  const { createEvent } = useEvents();
  const { createExpense } = useExpenses();
  const { consumePendingText, pendingText, open: openVoice } = useVoiceCapture();
  const qc = useQueryClient();

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null);
  const [resolvedMsgIds, setResolvedMsgIds] = useState<Set<string>>(new Set());
  const [aliceOpen, setAliceOpen] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("offload_muted") === "1");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPremium = profile?.is_premium;

  const { data: messages = [] } = useQuery({
    queryKey: ["offload_messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offload_messages")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as DbMessage[];
    },
    enabled: !!user,
  });

  const unreadCount = messages.filter((m) => m.role === "assistant" && !m.read).length;

  // Scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isProcessing]);

  // Pick up pending text from voice overlay (reacts every time new text arrives)
  useEffect(() => {
    if (!pendingText) return;
    const text = consumePendingText();
    if (text) handleSend(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingText]);

  const speak = (text: string) => {
    if (muted) return;
    if (isPremium) elevenLabs.speak(text);
    else tts.speak(text);
  };

  const insertMessage = async (msg: Omit<DbMessage, "id" | "created_at">) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("offload_messages")
      .insert({ user_id: user.id, ...msg, items: msg.items as any })
      .select()
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    qc.invalidateQueries({ queryKey: ["offload_messages"] });
    return data as unknown as DbMessage;
  };

const EXPENSE_CATEGORIES = ["casa", "filhos", "transporte", "estudos", "lazer", "alimentacao", "saude", "outros"];
const normalizeExpenseCategory = (value?: string | null) => {
  const raw = (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return EXPENSE_CATEGORIES.includes(raw) ? raw : "outros";
};

  const persistItems = async (items: AIItem[]) => {
    const results = await Promise.allSettled(
      items.map((item) => {
        if (item.type === "task" || item.type === "reminder") {
          return createTask.mutateAsync({
            title: item.title,
            due_date: item.date || null,
            due_time: item.time || null,
            priority: item.priority || "medium",
            category: item.category || "geral",
          });
        }
        if (item.type === "event") {
          const startDate = item.date ? `${item.date}T${item.time || "09:00"}:00` : new Date().toISOString();
          return createEvent.mutateAsync({ title: item.title, start_date: startDate, category: item.category || "geral" });
        }
        if (item.type === "expense") {
          return createExpense.mutateAsync({
            title: item.title,
            amount: item.amount || 0,
            expense_date: item.date || new Date().toISOString().split("T")[0],
            category: normalizeExpenseCategory(item.category),
          });
        }
        return Promise.reject(new Error("unknown item type"));
      })
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    results.forEach((r) => r.status === "rejected" && console.error("persistItems", r.reason));
    // Refresh all listing pages immediately
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["expenses"] });
    return { ok, failed };
  };

  const confirmItems = async (msgId: string, items: AIItem[]) => {
    setSavingMsgId(msgId);
    const { ok, failed } = await persistItems(items);
    setSavingMsgId(null);
    setResolvedMsgIds((prev) => new Set(prev).add(msgId));
    if (failed === 0) {
      toast({ title: t("offload.created", { count: ok, defaultValue: `${ok} item(s) criado(s)` }) });
    } else {
      toast({
        title: t("offload.partialCreated", { ok, failed, defaultValue: `${ok} criado(s), ${failed} falharam` }),
        variant: "destructive",
      });
    }
  };

  const dismissItems = (msgId: string) => {
    setResolvedMsgIds((prev) => new Set(prev).add(msgId));
  };

  const handleSend = async (raw?: string, opts?: { silent?: boolean }) => {
    const text = (raw ?? input).trim();
    if (!text || !user) return;
    setInput("");
    setIsProcessing(true);

    await insertMessage({ role: "user", content: text, items: null, read: true });

    try {
      // Build report context (aggregates) for the AI
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartIso = monthStart.toISOString().split("T")[0];

      const [pendingTasks, todayEvents, monthExpenses] = await Promise.all([
        supabase.from("tasks").select("id,title,due_date,priority", { count: "exact" }).eq("user_id", user.id).eq("completed", false),
        supabase.from("events").select("id,title,start_date").eq("user_id", user.id).gte("start_date", today).lte("start_date", today + "T23:59:59"),
        supabase.from("expenses").select("amount,currency,category,paid").eq("user_id", user.id).gte("expense_date", monthStartIso),
      ]);

      const expensesTotal = (monthExpenses.data || []).reduce((s, e: any) => s + Number(e.amount || 0), 0);
      const pending = (monthExpenses.data || []).filter((e: any) => !e.paid).reduce((s, e: any) => s + Number(e.amount || 0), 0);

      const context = {
        pendingTasksCount: pendingTasks.data?.length || 0,
        pendingTasksSample: (pendingTasks.data || []).slice(0, 5),
        todayEventsCount: todayEvents.data?.length || 0,
        todayEvents: todayEvents.data || [],
        monthExpensesTotal: expensesTotal,
        monthExpensesUnpaid: pending,
        unreadMessages: unreadCount,
      };

      const { data, error } = await supabase.functions.invoke("offload-process", {
        body: { text, language: i18n.language, context },
      });
      if (error) throw error;

      const response: string = data?.response || "";
      const items: AIItem[] = data?.items || [];

      const inserted = await insertMessage({ role: "assistant", content: response, items: items.length ? items : null, read: false });
      if (!opts?.silent) speak(response);

      // Auto-create only when the user clearly asked for it
      if (items.length && containsAny(text, AUTO_CREATE_WORDS)) {
        const { ok, failed } = await persistItems(items);
        if (inserted?.id) setResolvedMsgIds((prev) => new Set(prev).add(inserted.id));
        toast({
          title: failed
            ? t("offload.partialCreated", { ok, failed, defaultValue: `${ok} criado(s), ${failed} falharam` })
            : t("offload.autoCreated", { count: ok, defaultValue: `${ok} item(s) criado(s) automaticamente` }),
          variant: failed ? "destructive" : "default",
        });
      }

      return response;
    } catch (e) {
      console.error("Process error", e);
      toast({ title: t("offload.errorProcess"), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from("offload_messages").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["offload_messages"] });
  };

  const readUnread = () => {
    const unread = messages.filter((m) => m.role === "assistant" && !m.read);
    if (unread.length === 0) {
      toast({ title: t("offload.noUnread") });
      return;
    }
    speak(unread.map((m) => m.content).join(". "));
    markAllRead();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem("offload_muted", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            {t("offload.chatTitle")}
            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
          </h1>
          <p className="text-xs text-muted-foreground">{t("offload.chatSubtitle")}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setAliceOpen(true)} title={t("offload.assistantStart", { defaultValue: "Falar com a Alice" })}>
            <Sparkles className="w-5 h-5 text-primary" />
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={readUnread} title={t("offload.readUnread")}>
              <Bell className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleMute} title={muted ? t("offload.unmute") : t("offload.mute")}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !isProcessing && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">{t("offload.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1 px-8">{t("offload.emptyHint")}</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border text-foreground rounded-bl-sm"
              )}
            >
              <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&_p]:my-0">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {m.role === "assistant" && m.items && m.items.length > 0 && (
                resolvedMsgIds.has(m.id) ? (
                  <div className="mt-2 space-y-1.5">
                    {m.items.map((it, i) => {
                      const Icon = typeIcons[it.type] || CheckCircle2;
                      return (
                        <div key={i} className="flex items-center gap-2 bg-background/40 rounded-lg px-2 py-1.5">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <Icon className="w-4 h-4 shrink-0 opacity-70" />
                          <span className="text-xs flex-1 truncate">{it.title}</span>
                          {it.date && <span className="text-[10px] opacity-70">{it.date}</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ConfirmationCard
                    compact
                    items={m.items}
                    isLoading={savingMsgId === m.id}
                    onConfirm={() => confirmItems(m.id, m.items!)}
                    onDismiss={() => dismissItems(m.id)}
                  />
                )
              )}
              {m.role === "assistant" && (
                <button
                  onClick={() => speak(m.content)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100"
                >
                  <Volume2 className="w-3 h-3" /> {t("offload.readAloud")}
                </button>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t("offload.thinking")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-card/50">
        <Card className="shadow-soft border-0">
          <CardContent className="p-2 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={openVoice} title={t("offload.fabLabel")}>
              <Mic className="w-5 h-5 text-primary" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("offload.chatPlaceholder")}
              className="min-h-[40px] max-h-32 border-0 bg-transparent resize-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              disabled={!input.trim() || isProcessing}
              onClick={() => handleSend()}
              className="rounded-full gradient-calm text-white border-0 shrink-0"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>
      </div>

      <VoiceAssistantSheet
        open={aliceOpen}
        onOpenChange={setAliceOpen}
        onSend={(text) => handleSend(text, { silent: true })}
      />
    </div>
  );
};

export default OffloadPage;
