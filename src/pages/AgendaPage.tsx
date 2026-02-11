import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const AgendaPage = () => {
  const { t } = useTranslation();
  const [currentDate] = useState(new Date());
  const monthNames = t("agenda.months", { returnObjects: true }) as string[];
  const weekDays = t("agenda.weekDays", { returnObjects: true }) as string[];
  
  const events = [
    { time: "09:00", title: "Reunião de equipe", category: t("agenda.categories.work"), color: "bg-primary" },
    { time: "12:00", title: "Almoço com cliente", category: t("agenda.categories.work"), color: "bg-mindflow-sunrise" },
    { time: "15:00", title: "Buscar filho na escola", category: t("agenda.categories.family"), color: "bg-secondary" },
    { time: "18:00", title: "Academia", category: t("agenda.categories.personal"), color: "bg-mindflow-zen" },
  ];

  const today = currentDate.getDate();

  const generateWeekDays = () => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentDate);
      date.setDate(today + i);
      days.push({
        day: weekDays[date.getDay()],
        date: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{t("agenda.title")}</h1>
          <Button size="sm" className="gradient-calm text-white border-0">
            <Plus className="w-4 h-4 mr-1" />
            {t("agenda.new")}
          </Button>
        </div>
      </header>

      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-medium text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="flex justify-between">
          {generateWeekDays().map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                item.isToday
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span className="text-xs font-medium">{item.day}</span>
              <span className={`text-lg font-semibold mt-1 ${item.isToday ? "" : "text-foreground"}`}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="px-5 py-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">{t("agenda.todayEvents")}</h3>
        <div className="space-y-3">
          {events.map((event, index) => (
            <Card key={index} className="shadow-card border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  <div className={`w-1 ${event.color}`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {event.category}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AgendaPage;
