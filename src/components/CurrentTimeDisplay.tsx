import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { getTimeContext, TimeContext } from "@/services/context";

export default function CurrentTimeDisplay() {
  const [time, setTime] = useState<TimeContext>(getTimeContext());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeContext());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeIcon = () => {
    switch (time.timeOfDay) {
      case "morning":
        return <Sunrise className="h-5 w-5 text-orange-400" />;
      case "afternoon":
        return <Sun className="h-5 w-5 text-yellow-400" />;
      case "evening":
        return <Sunset className="h-5 w-5 text-orange-500" />;
      case "night":
        return <Moon className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full">
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-fuchsia-500/20">
              <Clock className="h-5 w-5 text-fuchsia-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{time.time}</p>
              <p className="text-sm text-slate-400">{time.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTimeIcon()}
            <span className="text-sm text-slate-300 capitalize">{time.timeOfDay}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>{time.timezone}</span>
          {time.isWeekend && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Weekend</span>
          )}
          {time.isBusinessHours && !time.isWeekend && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">Business Hours</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}