import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEvents } from "@/hooks/useEvents";
import EventForm from "@/components/events/EventForm";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  trabalho: "bg-primary",
  pessoal: "bg-mindflow-zen",
  familia: "bg-secondary",
  geral: "bg-mindflow-sunrise",
};

const AgendaPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);

  const monthNames = t("agenda.months", { returnObjects: true }) as string[];
  const weekDays = t("agenda.weekDays", { returnObjects: true }) as string[];

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const { data: events = [], createEvent, deleteEvent } = useEvents({ date: selectedDateStr });

  const navigateMonth = (dir: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
  };

  const generateWeekDays = () => {
    const days = [];
    const sel = selectedDate.getDate();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(sel + i);
      days.push({
        day: weekDays[date.getDay()],
        date: date.getDate(),
        fullDate: new Date(date),
        isSelected: i === 0,
      });
    }
    return days;
  };

  const handleCreateEvent = (event: Parameters<typeof createEvent.mutate>[0]) => {
    createEvent.mutate(event, {
      onSuccess: () => {
        setFormOpen(false);
        toast({ title: "Evento criado!" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{t("agenda.title")}</h1>
          <Button size="sm" className="gradient-calm text-white border-0" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t("agenda.new")}
          </Button>
        </div>
      </header>

      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-medium text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="flex justify-between">
          {generateWeekDays().map((item, index) => (
            <button
              key={index}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                item.isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setSelectedDate(item.fullDate)}
            >
              <span className="text-xs font-medium">{item.day}</span>
              <span className={`text-lg font-semibold mt-1 ${item.isSelected ? "" : "text-foreground"}`}>
                {item.date}
              </span>
            </button>
          ))}
        </div>
      </div>

      <section className="px-5 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">{t("agenda.todayEvents")}</h3>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhum evento neste dia</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id} className="shadow-card border-0 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className={`w-1 ${categoryColors[event.category || "geral"] || "bg-primary"}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.start_date ? new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            {event.end_date ? ` - ${new Date(event.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                          </p>
                          {event.location && <p className="text-xs text-muted-foreground mt-1">📍 {event.location}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {event.category || "geral"}
                          </span>
                          <button onClick={() => deleteEvent.mutate(event.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <EventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateEvent}
        isLoading={createEvent.isPending}
        defaultDate={selectedDateStr}
      />
    </div>
  );
};

export default AgendaPage;
