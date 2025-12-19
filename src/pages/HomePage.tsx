import { Plus, CheckCircle2, CreditCard, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Hoje você tem <span className="text-primary font-medium">3 reuniões</span>, 
          <span className="text-secondary font-medium"> 1 conta</span> para pagar e 
          <span className="text-primary font-medium"> 2 tarefas</span> pendentes.
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
              <p className="text-xl font-semibold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-xl font-semibold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Contas</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-mindflow-zen/20 flex items-center justify-center mx-auto mb-2">
                <CalendarDays className="w-5 h-5 text-mindflow-zen" />
              </div>
              <p className="text-xl font-semibold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Tasks */}
      <section className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">Tarefas de Hoje</h2>
        <div className="space-y-3">
          {[
            { title: "Revisar relatório mensal", time: "09:00", done: true },
            { title: "Reunião com equipe", time: "14:00", done: false },
            { title: "Enviar proposta ao cliente", time: "16:00", done: false },
          ].map((task, index) => (
            <Card key={index} className={`shadow-card border-0 transition-all duration-200 ${task.done ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.done ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                  {task.done && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{task.time}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                <p className="font-medium">Sugestão Inteligente</p>
                <p className="text-sm text-white/80 mt-1">
                  Você costuma fazer compras às sextas-feiras. Quer que eu crie um lembrete para amanhã?
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    Criar lembrete
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    Ignorar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-elevated gradient-calm hover:opacity-90 transition-all duration-200 z-40"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default HomePage;
