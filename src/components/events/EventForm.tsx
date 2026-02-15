import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event } from "@/hooks/useEvents";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: {
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    category?: string;
    location?: string;
  }) => void;
  initialData?: Event | null;
  isLoading?: boolean;
  defaultDate?: string;
}

const EventForm = ({ open, onOpenChange, onSubmit, initialData, isLoading, defaultDate }: EventFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startDate, setStartDate] = useState(initialData?.start_date?.slice(0, 10) || defaultDate || "");
  const [startTime, setStartTime] = useState(initialData?.start_date?.slice(11, 16) || "09:00");
  const [endTime, setEndTime] = useState(initialData?.end_date?.slice(11, 16) || "10:00");
  const [category, setCategory] = useState(initialData?.category || "geral");
  const [location, setLocation] = useState(initialData?.location || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      start_date: `${startDate}T${startTime}:00`,
      end_date: `${startDate}T${endTime}:00`,
      category,
      location: location || undefined,
    });
    if (!initialData) {
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setEndTime("10:00");
      setCategory("geral");
      setLocation("");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? "Editar Evento" : "Novo Evento"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input placeholder="Título do evento" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-12 rounded-xl" />
          <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" rows={2} />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Início</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Fim</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
          <Input placeholder="Local (opcional)" value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-xl" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="pessoal">Pessoal</SelectItem>
              <SelectItem value="familia">Família</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full h-12 gradient-calm text-white border-0 rounded-xl" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar Evento"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EventForm;
