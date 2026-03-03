import { CheckCircle2, Calendar, CreditCard, Bell, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

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
  response: string;
  onConfirm: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
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

const ConfirmationCard = ({ items, response, onConfirm, onDismiss, isLoading }: ConfirmationCardProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 animate-slide-up">
      {/* AI Response */}
      <Card className="shadow-soft border-0 gradient-calm text-white overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm">{response}</p>
        </CardContent>
      </Card>

      {/* Items */}
      {items.map((item, i) => {
        const Icon = typeIcons[item.type] || CheckCircle2;
        const colorClass = typeColors[item.type] || typeColors.task;
        return (
          <Card key={i} className="shadow-card border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                  {item.date && <span className="text-xs text-muted-foreground">{item.date}</span>}
                  {item.time && <span className="text-xs text-muted-foreground">{item.time}</span>}
                  {item.amount != null && (
                    <span className="text-xs text-muted-foreground">
                      R$ {item.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1 gradient-calm text-white border-0"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Confirmar
        </Button>
        <Button variant="outline" onClick={onDismiss} disabled={isLoading}>
          <Trash2 className="w-4 h-4 mr-2" />
          Descartar
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationCard;
