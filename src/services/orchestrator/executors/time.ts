import { ActionResult } from '../types';

export function executeGetCurrentTime(): ActionResult {
  const now = new Date();
  const timeInfo = {
    iso: now.toISOString(),
    local: now.toLocaleString(),
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
    hour: now.getHours(),
    minute: now.getMinutes(),
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    isBusinessHours: now.getHours() >= 9 && now.getHours() < 18,
  };

  return {
    tool: "get_current_time",
    success: true,
    data: timeInfo,
    timestamp: now.toISOString(),
  };
}