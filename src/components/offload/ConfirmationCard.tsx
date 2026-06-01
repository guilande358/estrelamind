import { CheckCircle2, Calendar, CreditCard, Bell, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface AIItem {
  type: "task" | "event" | "expense" | "reminder";
  title: string;
  date?: string;
  time?: string;
  amount?: number;
  category?: string;
  priority?: "low" | "medium" | "high";
}

interface ConfirmationCardProps {
  items: AIItem[];
  response?: string;
  onConfirm: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

const typeIcons = {
  task: CheckCircle2,
  event: Calendar,
  expense: CreditCard,
  reminder: Bell,
};

const typeColors = {
  task: "bg-primary/10 text-primary",
  event: "bg-mindflow-zen/20 text-mindflow-zen",
  expense: "bg-warning/10 text-warning",
  reminder: "bg-secondary/10 text-secondary",
};

const ConfirmationCard = ({ items, response, onConfirm, onDismiss, isLoading, compact }: ConfirmationCardProps) => {
  const { t } = useTranslation();

  return (
    <div className={compact ? "space-y-2 mt-2" : "space-y-3 animate-slide-up"}>
      {!compact && response && (
        <Card className="shadow-soft border-0 gradient-calm text-white overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm">{response}</p>
          </CardContent>
        </Card>
      )}

      {items.map((item, i) => {
        const Icon = typeIcons[item.type] || CheckCircle2;
        const colorClass = typeColors[item.type] || typeColors.task;
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-background/60",
              compact ? "p-2" : "p-4 shadow-card"
            )}
          >
            <div className={cn("rounded-full flex items-center justify-center", colorClass, compact ? "w-8 h-8" : "w-10 h-10")}>
              <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium text-foreground truncate", compact ? "text-xs" : "text-sm")}>{item.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                {item.date && <span className="text-[10px] text-muted-foreground">{item.date}</span>}
                {item.time && <span className="text-[10px] text-muted-foreground">{item.time}</span>}
                {item.amount != null && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className={cn("flex gap-2", compact ? "pt-1" : "pt-2 gap-3")}>
        <Button
          size={compact ? "sm" : "default"}
          className="flex-1 gradient-calm text-white border-0"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {t("offload.confirm", "Confirmar")}
        </Button>
        <Button size={compact ? "sm" : "default"} variant="outline" onClick={onDismiss} disabled={isLoading}>
          <Trash2 className="w-4 h-4 mr-2" />
          {t("offload.discard", "Descartar")}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationCard;
