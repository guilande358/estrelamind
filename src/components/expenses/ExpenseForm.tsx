import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Expense } from "@/hooks/useExpenses";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: {
    title: string;
    amount: number;
    expense_date?: string;
    category?: string;
    paid?: boolean;
    is_recurring?: boolean;
    recurring_day?: number;
  }) => void;
  initialData?: Expense | null;
  isLoading?: boolean;
}

const ExpenseForm = ({ open, onOpenChange, onSubmit, initialData, isLoading }: ExpenseFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [expenseDate, setExpenseDate] = useState(initialData?.expense_date || new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(initialData?.category || "outros");
  const [paid, setPaid] = useState(initialData?.paid || false);
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      amount: parseFloat(amount),
      expense_date: expenseDate,
      category,
      paid,
      is_recurring: isRecurring,
      recurring_day: isRecurring ? new Date(expenseDate).getDate() : undefined,
    });
    if (!initialData) {
      setTitle("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setCategory("outros");
      setPaid(false);
      setIsRecurring(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Despesa" : "Nova Despesa"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input placeholder="Título da despesa" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-12 rounded-xl" />
          <Input type="number" step="0.01" min="0" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} required className="h-12 rounded-xl" />
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="h-12 rounded-xl" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outros">Outros</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="estudos">Estudos</SelectItem>
              <SelectItem value="compras">Compras</SelectItem>
              <SelectItem value="alimentacao">Alimentação</SelectItem>
              <SelectItem value="saude">Saúde</SelectItem>
              <SelectItem value="lazer">Lazer</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm font-medium text-foreground">Já pago</span>
            <Switch checked={paid} onCheckedChange={setPaid} />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm font-medium text-foreground">Recorrente</span>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          <Button type="submit" className="w-full h-12 gradient-calm text-white border-0 rounded-xl" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar Despesa"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ExpenseForm;
