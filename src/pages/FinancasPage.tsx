import { useState } from "react";
import { TrendingDown, TrendingUp, CreditCard, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useExpenses } from "@/hooks/useExpenses";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { useToast } from "@/hooks/use-toast";

const categoryIcons: Record<string, string> = {
  casa: "🏠",
  transporte: "🚗",
  estudos: "📚",
  compras: "🛍️",
  alimentacao: "🍔",
  saude: "💊",
  lazer: "🎮",
  outros: "📦",
};

const FinancasPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [formOpen, setFormOpen] = useState(false);

  const { data: expenses = [], createExpense, deleteExpense, togglePaid } = useExpenses({ month: currentMonth });

  // Calculate stats
  const totalSpent = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const paidExpenses = expenses.filter((e) => e.paid);
  const unpaidExpenses = expenses.filter((e) => !e.paid);

  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "outros";
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {});

  const handleCreateExpense = (expense: Parameters<typeof createExpense.mutate>[0]) => {
    createExpense.mutate(expense, {
      onSuccess: () => {
        setFormOpen(false);
        toast({ title: "Despesa criada!" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{t("finances.title")}</h1>
          <Button size="sm" className="gradient-calm text-white border-0" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t("finances.add")}
          </Button>
        </div>
      </header>

      {/* Total Card */}
      <div className="px-5 py-3">
        <Card className="shadow-soft border-0 gradient-nature text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-white/80 text-sm">{t("finances.monthSpending")}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold">R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-sm">{expenses.length} despesas este mês</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {Object.keys(byCategory).length > 0 && (
        <section className="px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("finances.categories")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(byCategory).map(([cat, spent]) => {
              const percentage = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
              return (
                <Card key={cat} className="shadow-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{categoryIcons[cat] || "📦"}</span>
                      <span className="font-medium text-foreground text-sm capitalize">{cat}</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <Progress value={percentage} className="h-1.5 mt-2" />
                    <p className="text-xs mt-1 text-muted-foreground">{percentage}% do total</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Bills */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("finances.bills")}</h2>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhuma despesa este mês</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <Card key={expense.id} className="shadow-card border-0">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${expense.paid ? 'bg-success/10' : 'bg-warning/10'}`}
                      onClick={() => togglePaid.mutate({ id: expense.id, paid: !!expense.paid })}
                    >
                      <CreditCard className={`w-5 h-5 ${expense.paid ? 'text-success' : 'text-warning'}`} />
                    </button>
                    <div>
                      <p className="font-medium text-foreground">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">{t("finances.due", { date: expense.expense_date })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">R$ {Number(expense.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${expense.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {expense.paid ? t("finances.paid") : t("finances.pending")}
                      </span>
                    </div>
                    <button onClick={() => deleteExpense.mutate(expense.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateExpense}
        isLoading={createExpense.isPending}
      />
    </div>
  );
};

export default FinancasPage;
