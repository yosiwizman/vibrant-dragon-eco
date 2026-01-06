"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Clock, 
  Plus, 
  Trash2,
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  Globe,
  Bell,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  AlarmClock
} from "lucide-react";
import { getTimeContext, TimeContext } from "@/services/context";
import { showSuccess, showError } from "@/utils/toast";

interface WorldClock {
  id: string;
  city: string;
  timezone: string;
}

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalSeconds: number;
}

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  repeat: string[];
}

const POPULAR_TIMEZONES = [
  { city: "New York", timezone: "America/New_York" },
  { city: "London", timezone: "Europe/London" },
  { city: "Tokyo", timezone: "Asia/Tokyo" },
  { city: "Sydney", timezone: "Australia/Sydney" },
  { city: "Dubai", timezone: "Asia/Dubai" },
  { city: "Singapore", timezone: "Asia/Singapore" },
  { city: "Paris", timezone: "Europe/Paris" },
  { city: "Los Angeles", timezone: "America/Los_Angeles" },
  { city: "Hong Kong", timezone: "Asia/Hong_Kong" },
  { city: "Mumbai", timezone: "Asia/Kolkata" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClockWidget() {
  const [time, setTime] = useState<TimeContext>(getTimeContext());
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlarmDialogOpen, setIsAlarmDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [viewMode, setViewMode] = useState<"clock" | "timer" | "alarm">("clock");
  const [timer, setTimer] = useState<TimerState>({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    totalSeconds: 0
  });
  const [timerInput, setTimerInput] = useState("5");
  
  // Alarm form fields
  const [alarmTime, setAlarmTime] = useState("09:00");
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarmRepeat, setAlarmRepeat] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeContext());
      checkAlarms();
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms]);

  useEffect(() => {
    const saved = localStorage.getItem("worldClocks");
    if (saved) {
      try {
        setWorldClocks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load world clocks");
      }
    }
  }, []);

  useEffect(() => {
    const savedAlarms = localStorage.getItem("alarms");
    if (savedAlarms) {
      try {
        setAlarms(JSON.parse(savedAlarms));
      } catch (e) {
        console.error("Failed to load alarms");
      }
    }
  }, []);

  useEffect(() => {
    if (worldClocks.length > 0) {
      localStorage.setItem("worldClocks", JSON.stringify(worldClocks));
    }
  }, [worldClocks]);

  useEffect(() => {
    if (alarms.length > 0) {
      localStorage.setItem("alarms", JSON.stringify(alarms));
    }
  }, [alarms]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.totalSeconds > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTotal = prev.totalSeconds - 1;
          if (newTotal <= 0) {
            showSuccess("Timer finished!");
            return { minutes: 0, seconds: 0, isRunning: false, totalSeconds: 0 };
          }
          return {
            ...prev,
            totalSeconds: newTotal,
            minutes: Math.floor(newTotal / 60),
            seconds: newTotal % 60
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.totalSeconds]);

  const checkAlarms = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = DAYS[now.getDay()];

    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentTime) {
        if (alarm.repeat.length === 0 || alarm.repeat.includes(currentDay)) {
          showSuccess(`⏰ Alarm: ${alarm.label || "Time's up!"}`);
          // Play notification sound (browser notification API)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Alarm', {
              body: alarm.label || "Time's up!",
              icon: '/favicon.ico'
            });
          }
        }
      }
    });
  };

  const getTimeIcon = () => {
    switch (time.timeOfDay) {
      case "morning":
        return <Sunrise className="h-4 w-4 text-orange-400" />;
      case "afternoon":
        return <Sun className="h-4 w-4 text-yellow-400" />;
      case "evening":
        return <Sunset className="h-4 w-4 text-orange-500" />;
      case "night":
        return <Moon className="h-4 w-4 text-blue-400" />;
    }
  };

  const addWorldClock = () => {
    if (!selectedCity || !selectedTimezone) {
      showError("Please select a city");
      return;
    }

    if (worldClocks.some(c => c.timezone === selectedTimezone)) {
      showError("Clock already exists");
      return;
    }

    const newClock: WorldClock = {
      id: Date.now().toString(),
      city: selectedCity,
      timezone: selectedTimezone
    };

    setWorldClocks([...worldClocks, newClock]);
    setIsDialogOpen(false);
    setSelectedCity("");
    setSelectedTimezone("");
    showSuccess("World clock added!");
  };

  const removeWorldClock = (id: string) => {
    setWorldClocks(worldClocks.filter(c => c.id !== id));
    showSuccess("World clock removed");
  };

  const addAlarm = () => {
    if (!alarmTime) {
      showError("Please set alarm time");
      return;
    }

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      time: alarmTime,
      label: alarmLabel.trim() || "Alarm",
      enabled: true,
      repeat: alarmRepeat
    };

    setAlarms([...alarms, newAlarm]);
    setIsAlarmDialogOpen(false);
    setAlarmTime("09:00");
    setAlarmLabel("");
    setAlarmRepeat([]);
    showSuccess("Alarm created!");

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id));
    showSuccess("Alarm deleted");
  };

  const toggleRepeatDay = (day: string) => {
    if (alarmRepeat.includes(day)) {
      setAlarmRepeat(alarmRepeat.filter(d => d !== day));
    } else {
      setAlarmRepeat([...alarmRepeat, day]);
    }
  };

  const getTimeInTimezone = (timezone: string) => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: timezone,
        month: "short",
        day: "numeric"
      });
      return { time: timeStr, date: dateStr };
    } catch (e) {
      return { time: "--:--", date: "---" };
    }
  };

  const startTimer = () => {
    const minutes = parseInt(timerInput) || 0;
    if (minutes <= 0) {
      showError("Please enter a valid time");
      return;
    }
    const totalSeconds = minutes * 60;
    setTimer({
      minutes,
      seconds: 0,
      isRunning: true,
      totalSeconds
    });
  };

  const toggleTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setTimer({ minutes: 0, seconds: 0, isRunning: false, totalSeconds: 0 });
  };

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur h-full w-full overflow-hidden flex flex-col">
        <CardHeader className="p-3 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-fuchsia-400" />
              Clock
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode(viewMode === "clock" ? "timer" : viewMode === "timer" ? "alarm" : "clock")}
                className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
              >
                {viewMode === "clock" ? "Timer" : viewMode === "timer" ? "Alarm" : "Clock"}
              </Button>
              {viewMode === "clock" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(true)}
                  className="h-6 w-6 p-0 text-fuchsia-400 hover:text-fuchsia-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {viewMode === "alarm" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAlarmDialogOpen(true)}
                  className="h-6 w-6 p-0 text-fuchsia-400 hover:text-fuchsia-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3">
          {viewMode === "timer" ? (
            /* Timer View */
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
                </div>
                {!timer.isRunning && timer.totalSeconds === 0 && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      className="bg-slate-900/50 border-slate-700 text-white text-center"
                      value={timerInput}
                      onChange={(e) => setTimerInput(e.target.value)}
                      min="1"
                      max="999"
                    />
                    <Button
                      onClick={startTimer}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {timer.totalSeconds > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={toggleTimer}
                      className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    >
                      {timer.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetTimer}
                      className="border-slate-600 text-slate-300"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 5, 10, 15, 20, 30].map(min => (
                  <Button
                    key={min}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTimerInput(min.toString());
                      const totalSeconds = min * 60;
                      setTimer({
                        minutes: min,
                        seconds: 0,
                        isRunning: true,
                        totalSeconds
                      });
                    }}
                    className="border-slate-600 text-slate-300 text-xs"
                  >
                    {min}m
                  </Button>
                ))}
              </div>
            </div>
          ) : viewMode === "alarm" ? (
            /* Alarm View */
            <div className="space-y-2">
              {alarms.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">
                  No alarms set
                </p>
              ) : (
                alarms.map(alarm => (
                  <div
                    key={alarm.id}
                    className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-white">{alarm.time}</p>
                          <Switch
                            checked={alarm.enabled}
                            onCheckedChange={() => toggleAlarm(alarm.id)}
                          />
                        </div>
                        <p className="text-xs text-slate-400">{alarm.label}</p>
                        {alarm.repeat.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {alarm.repeat.map(day => (
                              <span
                                key={day}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlarm(alarm.id)}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Clock View */
            <>
              {/* Main Clock */}
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-white">{time.time}</p>
                    <p className="text-xs text-slate-400">{time.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {getTimeIcon()}
                      <span className="text-xs text-slate-300 capitalize">{time.timeOfDay}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{time.timezone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {time.isWeekend && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
                      Weekend
                    </span>
                  )}
                  {time.isBusinessHours && !time.isWeekend && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                      Business Hours
                    </span>
                  )}
                </div>
              </div>

              {/* World Clocks */}
              {worldClocks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Globe className="h-3 w-3" />
                    <span>World Clocks</span>
                  </div>
                  {worldClocks.map(clock => {
                    const { time: clockTime, date: clockDate } = getTimeInTimezone(clock.timezone);
                    return (
                      <div
                        key={clock.id}
                        className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{clock.city}</p>
                          <p className="text-xs text-slate-400">{clockTime}</p>
                          <p className="text-[10px] text-slate-500">{clockDate}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorldClock(clock.id)}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add World Clock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add World Clock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Select City</label>
              <Select
                value={selectedTimezone}
                onValueChange={(value) => {
                  setSelectedTimezone(value);
                  const city = POPULAR_TIMEZONES.find(t => t.timezone === value)?.city || "";
                  setSelectedCity(city);
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a city" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {POPULAR_TIMEZONES.map(tz => (
                    <SelectItem key={tz.timezone} value={tz.timezone} className="text-white">
                      {tz.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={addWorldClock}
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              >
                Add Clock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Alarm Dialog */}
      <Dialog open={isAlarmDialogOpen} onOpenChange={setIsAlarmDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlarmClock className="h-5 w-5 text-fuchsia-400" />
              New Alarm
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Time</label>
              <Input
                type="time"
                className="bg-slate-800 border-slate-700 text-white"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Label</label>
              <Input
                placeholder="Wake up, Meeting, etc."
                className="bg-slate-800 border-slate-700 text-white"
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Repeat</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => (
                  <Button
                    key={day}
                    size="sm"
                    variant={alarmRepeat.includes(day) ? "default" : "outline"}
                    onClick={() => toggleRepeatDay(day)}
                    className={alarmRepeat.includes(day) 
                      ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500" 
                      : "border-slate-600 text-slate-300"
                    }
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {alarmRepeat.length === 0 ? "One time alarm" : `Repeats on ${alarmRepeat.join(", ")}`}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAlarmDialogOpen(false);
                  setAlarmTime("09:00");
                  setAlarmLabel("");
                  setAlarmRepeat([]);
                }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={addAlarm}
                className="bg-fuchsia-600 text-white hover:bg-fuchsia-500"
              >
                Create Alarm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}