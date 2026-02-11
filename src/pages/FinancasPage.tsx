import { TrendingDown, CreditCard, Home, Car, GraduationCap, ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

const FinancasPage = () => {
  const { t } = useTranslation();

  const categories = [
    { name: t("finances.home"), icon: Home, spent: 1200, budget: 1500, color: "bg-primary" },
    { name: t("finances.transport"), icon: Car, spent: 450, budget: 500, color: "bg-secondary" },
    { name: t("finances.studies"), icon: GraduationCap, spent: 300, budget: 400, color: "bg-mindflow-zen" },
    { name: t("finances.shopping"), icon: ShoppingBag, spent: 680, budget: 600, color: "bg-mindflow-sunrise" },
  ];

  const bills = [
    { name: "Aluguel", amount: 1200, dueDate: "05/01", paid: true },
    { name: "Internet", amount: 120, dueDate: "10/01", paid: false },
    { name: "Energia", amount: 180, dueDate: "15/01", paid: false },
    { name: "Escola - Mensalidade", amount: 800, dueDate: "05/01", paid: true },
  ];

  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalBudget = categories.reduce((acc, cat) => acc + cat.budget, 0);

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{t("finances.title")}</h1>
          <Button size="sm" className="gradient-calm text-white border-0">
            <Plus className="w-4 h-4 mr-1" />
            {t("finances.add")}
          </Button>
        </div>
      </header>

      <div className="px-5 py-3">
        <Card className="shadow-soft border-0 gradient-nature text-white overflow-hidden">
          <CardContent className="p-5">
            <p className="text-white/80 text-sm">{t("finances.monthSpending")}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold">R$ {totalSpent.toLocaleString()}</span>
              <span className="text-white/70 text-sm mb-1">/ R$ {totalBudget.toLocaleString()}</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">{t("finances.lessLastMonth", { percent: 12 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("finances.categories")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const percentage = Math.round((category.spent / category.budget) * 100);
            const isOverBudget = percentage > 100;
            
            return (
              <Card key={index} className="shadow-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${category.color}/10 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="font-medium text-foreground text-sm">{category.name}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    R$ {category.spent}
                  </p>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-1.5 mt-2 ${isOverBudget ? 'bg-destructive/20' : ''}`}
                  />
                  <p className={`text-xs mt-1 ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isOverBudget 
                      ? t("finances.above", { percent: percentage - 100 })
                      : t("finances.remaining", { percent: 100 - percentage })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("finances.bills")}</h2>
        <div className="space-y-3">
          {bills.map((bill, index) => (
            <Card key={index} className="shadow-card border-0">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bill.paid ? 'bg-success/10' : 'bg-warning/10'}`}>
                    <CreditCard className={`w-5 h-5 ${bill.paid ? 'text-success' : 'text-warning'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bill.name}</p>
                    <p className="text-sm text-muted-foreground">{t("finances.due", { date: bill.dueDate })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">R$ {bill.amount}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${bill.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {bill.paid ? t("finances.paid") : t("finances.pending")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FinancasPage;
