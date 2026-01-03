import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Bell, CheckSquare, Calendar, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRecurringItems, cancelRecurringSeries, RecurringItem } from "@/services/recurrence";
import { recurrenceToString } from "@/services/smart-time-parser";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

export default function RecurringItemsWidget() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const recurringItems = await getRecurringItems(user.id);
      setItems(recurringItems);
    } catch (error) {
      console.error("Failed to load recurring items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (item: RecurringItem) => {
    if (!user) return;
    
    const result = await cancelRecurringSeries(user.id, item.type, item.id);
    if (result.success) {
      showSuccess(`Cancelled recurring ${item.type}`);
      loadItems();
    } else {
      showError(result.error || "Failed to cancel");
    }
  };

  if (isLoading) {
    return (
      <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur">
        <CardContent className="p-6 text-center text-slate-400">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null; // Don't show widget if no recurring items
  }

  return (
    <Card className="border-fuchsia-500/20 bg-black/40 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-fuchsia-400" />
          Recurring Items
          <Badge variant="outline" className="ml-auto border-slate-600 text-slate-400">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item.type === "task" ? "bg-blue-500/20" : "bg-yellow-500/20"}`}>
                    {item.type === "task" ? (
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {recurrenceToString(item.recurrenceRule)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        Next: {format(item.nextOccurrence, "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancel(item)}
                  className="text-slate-400 hover:text-red-400 h-8 w-8"
                  title="Cancel recurring series"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}