import { useState } from "react";
import { Plus, CheckCircle2, CreditCard, CalendarDays, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useTasks } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";
import TaskForm from "@/components/tasks/TaskForm";
import { useToast } from "@/hooks/use-toast";

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t("greeting.morning") : currentHour < 18 ? t("greeting.afternoon") : t("greeting.evening");

  const { data: tasks = [], toggleTask, deleteTask } = useTasks({ dueDate: today });
  const { data: events = [] } = useEvents({ date: today });
  const { data: unpaidExpenses = [] } = useExpenses({ paid: false });

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const { createTask } = useTasks();

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  const handleCreateTask = (task: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(task, {
      onSuccess: () => {
        setTaskFormOpen(false);
        toast({ title: "Tarefa criada!" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background safe-top">
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("home.todaySummary", { meetings: events.length, bills: unpaidExpenses.length, tasks: tasks.filter(t => !t.completed).length })
            .replace(/<\/?meetings>/g, '')
            .replace(/<\/?bills>/g, '')
            .replace(/<\/?tasks>/g, '')}
        </p>
      </header>

      {/* Quick Stats */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card border-0">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-semibold text-foreground">{tasks.filter(t => !t.completed).length}</p>
              <p className="text-xs text-muted-foreground">{t("home.tasks")}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-xl font-semibold text-foreground">{unpaidExpenses.length}</p>
              <p className="text-xs text-muted-foreground">{t("home.bills")}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-mindflow-zen/20 flex items-center justify-center mx-auto mb-2">
                <CalendarDays className="w-5 h-5 text-mindflow-zen" />
              </div>
              <p className="text-xl font-semibold text-foreground">{events.length}</p>
              <p className="text-xs text-muted-foreground">{t("home.events")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Tasks */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("home.todayTasks")}</h2>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Nenhuma tarefa para hoje</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className={`shadow-card border-0 transition-all duration-200 ${task.completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <button
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}
                    onClick={() => toggleTask.mutate({ id: task.id, completed: !!task.completed })}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </p>
                    {task.due_time && <p className="text-sm text-muted-foreground">{task.due_time.slice(0, 5)}</p>}
                  </div>
                  <button onClick={() => deleteTask.mutate(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* AI Suggestions */}
      <section className="px-5 py-4">
        <Card className="shadow-soft border-0 gradient-calm text-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{t("home.aiSuggestion")}</p>
                <p className="text-sm text-white/80 mt-1">
                  {t("home.aiSuggestionText")}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    {t("home.createReminder")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    {t("home.ignore")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAB */}
      <Button
        size="lg"
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-elevated gradient-calm hover:opacity-90 transition-all duration-200 z-40"
        onClick={() => setTaskFormOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
      />
    </div>
  );
};

export default HomePage;
