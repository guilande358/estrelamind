import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { Task } from "@/hooks/useTasks";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    due_date?: string;
    due_time?: string;
    priority?: string;
    category?: string;
  }) => void;
  initialData?: Task | null;
  isLoading?: boolean;
}

const TaskForm = ({ open, onOpenChange, onSubmit, initialData, isLoading }: TaskFormProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [dueTime, setDueTime] = useState(initialData?.due_time || "");
  const [priority, setPriority] = useState(initialData?.priority || "medium");
  const [category, setCategory] = useState(initialData?.category || "geral");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      due_date: dueDate || undefined,
      due_time: dueTime || undefined,
      priority,
      category,
    });
    if (!initialData) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setDueTime("");
      setPriority("medium");
      setCategory("geral");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Tarefa" : "Nova Tarefa"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input placeholder="Título da tarefa" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-12 rounded-xl" />
          <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-12 rounded-xl" />
            <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Baixa</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="high">🔴 Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="estudos">Estudos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full h-12 gradient-calm text-white border-0 rounded-xl" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar Tarefa"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default TaskForm;
