import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, BarChart3, PieChart as PieIcon, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { useExchangeRates, convert, formatMoney, SUPPORTED_CURRENCIES } from "@/hooks/useExchangeRates";
import { exportCSV, exportPDF } from "@/lib/exporters";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const ReportsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const targetCurrency = profile?.preferred_currency || "BRL";
  const { data: rates } = useExchangeRates("USD");

  const { data: expenses = [] } = useExpenses();
  const { data: events = [] } = useEvents();
  const { data: tasks = [] } = useTasks();

  const [tab, setTab] = useState("financas");

  // ---- Finanças ----
  const expenseRows = useMemo(
    () =>
      expenses.map((e) => {
        const converted = convert(Number(e.amount), e.currency || "BRL", targetCurrency, rates);
        return { ...e, converted };
      }),
    [expenses, targetCurrency, rates],
  );

  const totalSpent = expenseRows.reduce((s, e) => s + (e.converted > 0 ? e.converted : 0), 0);
  const totalIncome = expenseRows.reduce((s, e) => s + (e.converted < 0 ? -e.converted : 0), 0);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenseRows.forEach((e) => {
      if (e.converted <= 0) return;
      map[e.category || "outros"] = (map[e.category || "outros"] || 0) + e.converted;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [expenseRows]);

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; gastos: number; receitas: number }> = {};
    expenseRows.forEach((e) => {
      const m = (e.expense_date || "").slice(0, 7);
      if (!m) return;
      if (!map[m]) map[m] = { month: m, gastos: 0, receitas: 0 };
      if (e.converted >= 0) map[m].gastos += e.converted;
      else map[m].receitas += -e.converted;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({ ...d, gastos: Number(d.gastos.toFixed(2)), receitas: Number(d.receitas.toFixed(2)) }));
  }, [expenseRows]);

  // ---- Tarefas concluídas por semana ----
  const completedByWeek = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (!t.completed) return;
      const d = new Date(t.updated_at || t.created_at);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-S${String(week).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([semana, total]) => ({ semana, total }));
  }, [tasks]);

  const taskStatus = useMemo(() => {
    const done = tasks.filter((t) => t.completed).length;
    const pending = tasks.length - done;
    return [
      { name: "Concluídas", value: done },
      { name: "Pendentes", value: pending },
    ];
  }, [tasks]);

  // ---- Exporters ----
  const exportExpensesCSV = () => {
    exportCSV(
      `financas-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Data", "Título", "Categoria", "Valor", "Moeda", `Convertido (${targetCurrency})`, "Pago"],
      expenseRows.map((e) => [
        e.expense_date,
        e.title,
        e.category || "",
        Number(e.amount).toFixed(2),
        e.currency || "BRL",
        e.converted.toFixed(2),
        e.paid ? "Sim" : "Não",
      ]),
    );
    toast({ title: "CSV exportado" });
  };

  const exportExpensesPDF = () => {
    exportPDF(
      "Relatório Financeiro",
      `financas-${new Date().toISOString().slice(0, 10)}.pdf`,
      ["Data", "Título", "Categoria", `Valor (${targetCurrency})`, "Pago"],
      expenseRows.map((e) => [
        e.expense_date,
        e.title,
        e.category || "",
        formatMoney(e.converted, targetCurrency),
        e.paid ? "Sim" : "Não",
      ]),
      `Total gastos: ${formatMoney(totalSpent, targetCurrency)} · Receitas: ${formatMoney(totalIncome, targetCurrency)}`,
    );
    toast({ title: "PDF exportado" });
  };

  const exportAgendaCSV = () => {
    exportCSV(
      `agenda-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Início", "Fim", "Título", "Local", "Categoria"],
      events.map((e) => [
        e.start_date,
        e.end_date || "",
        e.title,
        e.location || "",
        e.category || "",
      ]),
    );
    toast({ title: "CSV exportado" });
  };

  const exportAgendaPDF = () => {
    exportPDF(
      "Agenda",
      `agenda-${new Date().toISOString().slice(0, 10)}.pdf`,
      ["Início", "Título", "Local", "Categoria"],
      events.map((e) => [new Date(e.start_date).toLocaleString(), e.title, e.location || "", e.category || ""]),
      `${events.length} evento(s)`,
    );
    toast({ title: "PDF exportado" });
  };

  return (
    <div className="min-h-screen bg-background safe-top pb-24">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
      </header>

      <div className="px-5">
        <Card className="border-0 shadow-card mb-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Moeda preferida</p>
              <p className="font-semibold">
                {targetCurrency} ({SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency)?.name || ""})
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/perfil")}>
              Alterar
            </Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="financas"><BarChart3 className="w-4 h-4 mr-1" />Finanças</TabsTrigger>
            <TabsTrigger value="tarefas"><ListChecks className="w-4 h-4 mr-1" />Tarefas & Agenda</TabsTrigger>
          </TabsList>

          <TabsContent value="financas" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Gastos totais</p>
                  <p className="text-xl font-bold text-destructive">{formatMoney(totalSpent, targetCurrency)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-xl font-bold text-success">{formatMoney(totalIncome, targetCurrency)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PieIcon className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Gastos por categoria</p>
                </div>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoney(v, targetCurrency)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Evolução mensal</p>
                </div>
                {monthly.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: number) => formatMoney(v, targetCurrency)} />
                      <Legend />
                      <Bar dataKey="gastos" fill="#EF4444" />
                      <Bar dataKey="receitas" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={exportExpensesCSV}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button onClick={exportExpensesPDF} className="gradient-calm text-white border-0">
                <FileText className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tarefas" className="space-y-4 mt-4">
            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PieIcon className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Status de tarefas</p>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sem tarefas</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={taskStatus} dataKey="value" nameKey="name" outerRadius={80} label>
                        <Cell fill="#10B981" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <p className="font-semibold">Tarefas concluídas por semana</p>
                </div>
                {completedByWeek.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={completedByWeek}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="semana" fontSize={11} />
                      <YAxis fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-card">
              <CardContent className="p-4">
                <p className="font-semibold mb-2">Agenda</p>
                <p className="text-sm text-muted-foreground mb-3">{events.length} eventos registrados</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={exportAgendaCSV}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                  <Button onClick={exportAgendaPDF} className="gradient-calm text-white border-0">
                    <FileText className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsPage;
