/**
 * Smart Time Parser - Enhanced natural language time parsing
 * Handles complex expressions like "next Tuesday at 3pm", "in 2 weeks", "every other day"
 */

export interface ParsedTime {
  date: Date;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  confidence: number;
  originalText: string;
  remainingText: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  dayOfMonth?: number;
  endDate?: Date;
  count?: number;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

// Get the next occurrence of a specific day of week
function getNextDayOfWeek(dayIndex: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  result.setHours(9, 0, 0, 0); // Default to 9 AM
  const currentDay = result.getDay();
  const daysUntil = (dayIndex - currentDay + 7) % 7 || 7; // If today, get next week
  result.setDate(result.getDate() + daysUntil);
  return result;
}

// Parse time of day (e.g., "3pm", "15:30", "3:30 pm")
function parseTimeOfDay(text: string): { hours: number; minutes: number } | null {
  // Match patterns like "3pm", "3:30pm", "15:00", "3:30 pm"
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2}):(\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] && !match[2].match(/am|pm/i) ? parseInt(match[2]) : 0;
      const meridiem = match[3] || match[2];

      if (meridiem?.toLowerCase() === "pm" && hours < 12) hours += 12;
      if (meridiem?.toLowerCase() === "am" && hours === 12) hours = 0;

      return { hours, minutes };
    }
  }

  return null;
}

// Parse relative time expressions
function parseRelativeTime(text: string, now: Date): ParsedTime | null {
  const lowerText = text.toLowerCase();

  // "in X minutes/hours/days/weeks"
  const inPattern = /in\s+(\d+)\s+(minute|hour|day|week|month|year)s?/i;
  const inMatch = lowerText.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2].toLowerCase();
    const result = new Date(now);

    switch (unit) {
      case "minute":
        result.setMinutes(result.getMinutes() + amount);
        break;
      case "hour":
        result.setHours(result.getHours() + amount);
        break;
      case "day":
        result.setDate(result.getDate() + amount);
        break;
      case "week":
        result.setDate(result.getDate() + amount * 7);
        break;
      case "month":
        result.setMonth(result.getMonth() + amount);
        break;
      case "year":
        result.setFullYear(result.getFullYear() + amount);
        break;
    }

    return {
      date: result,
      isRecurring: false,
      confidence: 0.95,
      originalText: inMatch[0],
      remainingText: text.replace(inPattern, "").trim(),
    };
  }

  // "tomorrow", "today", "tonight"
  if (/\btomorrow\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0);

    // Check for time specification
    const timeMatch = parseTimeOfDay(lowerText);
    if (timeMatch) {
      result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);
    }

    return {
      date: result,
      isRecurring: false,
      confidence: 0.98,
      originalText: "tomorrow",
      remainingText: text.replace(/\btomorrow\b/i, "").trim(),
    };
  }

  if (/\btonight\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setHours(20, 0, 0, 0);
    return {
      date: result,
      isRecurring: false,
      confidence: 0.95,
      originalText: "tonight",
      remainingText: text.replace(/\btonight\b/i, "").trim(),
    };
  }

  if (/\bthis evening\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setHours(18, 0, 0, 0);
    return {
      date: result,
      isRecurring: false,
      confidence: 0.95,
      originalText: "this evening",
      remainingText: text.replace(/\bthis evening\b/i, "").trim(),
    };
  }

  if (/\bthis afternoon\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setHours(14, 0, 0, 0);
    return {
      date: result,
      isRecurring: false,
      confidence: 0.95,
      originalText: "this afternoon",
      remainingText: text.replace(/\bthis afternoon\b/i, "").trim(),
    };
  }

  return null;
}

// Parse day of week expressions
function parseDayOfWeek(text: string, now: Date): ParsedTime | null {
  const lowerText = text.toLowerCase();

  // "next [day]" or "this [day]"
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayName = DAY_NAMES[i];
    const nextPattern = new RegExp(`next\\s+${dayName}`, "i");
    const thisPattern = new RegExp(`this\\s+${dayName}`, "i");
    const onPattern = new RegExp(`on\\s+${dayName}`, "i");
    const justDayPattern = new RegExp(`\\b${dayName}\\b`, "i");

    if (nextPattern.test(lowerText)) {
      const result = getNextDayOfWeek(i, now);
      // If "next" is specified and it's the same day, add a week
      if (result.getDay() === now.getDay()) {
        result.setDate(result.getDate() + 7);
      }

      // Check for time
      const timeMatch = parseTimeOfDay(lowerText);
      if (timeMatch) {
        result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);
      }

      return {
        date: result,
        isRecurring: false,
        confidence: 0.95,
        originalText: `next ${dayName}`,
        remainingText: text.replace(nextPattern, "").trim(),
      };
    }

    if (thisPattern.test(lowerText) || onPattern.test(lowerText)) {
      const result = getNextDayOfWeek(i, now);
      
      const timeMatch = parseTimeOfDay(lowerText);
      if (timeMatch) {
        result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);
      }

      return {
        date: result,
        isRecurring: false,
        confidence: 0.9,
        originalText: `${dayName}`,
        remainingText: text.replace(thisPattern, "").replace(onPattern, "").trim(),
      };
    }
  }

  return null;
}

// Parse recurring expressions
function parseRecurring(text: string, now: Date): ParsedTime | null {
  const lowerText = text.toLowerCase();

  // "every day" / "daily"
  if (/\b(every\s+day|daily)\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setHours(9, 0, 0, 0);
    if (result <= now) result.setDate(result.getDate() + 1);

    const timeMatch = parseTimeOfDay(lowerText);
    if (timeMatch) {
      result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);
    }

    return {
      date: result,
      isRecurring: true,
      recurrenceRule: { frequency: "daily", interval: 1 },
      confidence: 0.95,
      originalText: "every day",
      remainingText: text.replace(/\b(every\s+day|daily)\b/i, "").trim(),
    };
  }

  // "every week" / "weekly"
  if (/\b(every\s+week|weekly)\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setDate(result.getDate() + 7);
    result.setHours(9, 0, 0, 0);

    return {
      date: result,
      isRecurring: true,
      recurrenceRule: { frequency: "weekly", interval: 1 },
      confidence: 0.95,
      originalText: "every week",
      remainingText: text.replace(/\b(every\s+week|weekly)\b/i, "").trim(),
    };
  }

  // "every [day]" (e.g., "every Monday")
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const pattern = new RegExp(`every\\s+${DAY_NAMES[i]}`, "i");
    if (pattern.test(lowerText)) {
      const result = getNextDayOfWeek(i, now);

      const timeMatch = parseTimeOfDay(lowerText);
      if (timeMatch) {
        result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);
      }

      return {
        date: result,
        isRecurring: true,
        recurrenceRule: { frequency: "weekly", interval: 1, daysOfWeek: [i] },
        confidence: 0.95,
        originalText: `every ${DAY_NAMES[i]}`,
        remainingText: text.replace(pattern, "").trim(),
      };
    }
  }

  // "every other day" / "every 2 days"
  if (/\bevery\s+other\s+day\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setDate(result.getDate() + 2);
    result.setHours(9, 0, 0, 0);

    return {
      date: result,
      isRecurring: true,
      recurrenceRule: { frequency: "daily", interval: 2 },
      confidence: 0.95,
      originalText: "every other day",
      remainingText: text.replace(/\bevery\s+other\s+day\b/i, "").trim(),
    };
  }

  // "every X days/weeks/months"
  const everyNPattern = /every\s+(\d+)\s+(day|week|month|year)s?/i;
  const everyNMatch = lowerText.match(everyNPattern);
  if (everyNMatch) {
    const interval = parseInt(everyNMatch[1]);
    const unit = everyNMatch[2].toLowerCase();
    const result = new Date(now);

    let frequency: RecurrenceRule["frequency"];
    switch (unit) {
      case "day":
        frequency = "daily";
        result.setDate(result.getDate() + interval);
        break;
      case "week":
        frequency = "weekly";
        result.setDate(result.getDate() + interval * 7);
        break;
      case "month":
        frequency = "monthly";
        result.setMonth(result.getMonth() + interval);
        break;
      case "year":
        frequency = "yearly";
        result.setFullYear(result.getFullYear() + interval);
        break;
      default:
        frequency = "daily";
    }

    result.setHours(9, 0, 0, 0);

    return {
      date: result,
      isRecurring: true,
      recurrenceRule: { frequency, interval },
      confidence: 0.9,
      originalText: everyNMatch[0],
      remainingText: text.replace(everyNPattern, "").trim(),
    };
  }

  // "monthly" / "every month"
  if (/\b(monthly|every\s+month)\b/i.test(lowerText)) {
    const result = new Date(now);
    result.setMonth(result.getMonth() + 1);
    result.setHours(9, 0, 0, 0);

    return {
      date: result,
      isRecurring: true,
      recurrenceRule: { frequency: "monthly", interval: 1, dayOfMonth: now.getDate() },
      confidence: 0.95,
      originalText: "monthly",
      remainingText: text.replace(/\b(monthly|every\s+month)\b/i, "").trim(),
    };
  }

  return null;
}

// Parse absolute time (e.g., "at 3pm")
function parseAbsoluteTime(text: string, now: Date): ParsedTime | null {
  const timeMatch = parseTimeOfDay(text);
  if (timeMatch) {
    const result = new Date(now);
    result.setHours(timeMatch.hours, timeMatch.minutes, 0, 0);

    // If time has passed today, assume tomorrow
    if (result <= now) {
      result.setDate(result.getDate() + 1);
    }

    const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
    return {
      date: result,
      isRecurring: false,
      confidence: 0.85,
      originalText: text.match(timePattern)?.[0] || "",
      remainingText: text.replace(timePattern, "").trim(),
    };
  }

  return null;
}

/**
 * Main parsing function - attempts to parse natural language time expressions
 */
export function parseNaturalTime(text: string): ParsedTime | null {
  const now = new Date();

  // Try each parser in order of specificity
  const parsers = [
    parseRecurring,
    parseDayOfWeek,
    parseRelativeTime,
    parseAbsoluteTime,
  ];

  for (const parser of parsers) {
    const result = parser(text, now);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Convert recurrence rule to human-readable string
 */
export function recurrenceToString(rule: RecurrenceRule): string {
  const parts: string[] = [];

  if (rule.interval === 1) {
    parts.push(rule.frequency);
  } else if (rule.interval === 2 && rule.frequency === "daily") {
    parts.push("every other day");
  } else if (rule.interval === 2 && rule.frequency === "weekly") {
    parts.push("biweekly");
  } else {
    parts.push(`every ${rule.interval} ${rule.frequency.replace("ly", "")}s`);
  }

  if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    const dayNames = rule.daysOfWeek.map(d => DAY_NAMES[d]);
    parts.push(`on ${dayNames.join(", ")}`);
  }

  if (rule.endDate) {
    parts.push(`until ${rule.endDate.toLocaleDateString()}`);
  }

  if (rule.count) {
    parts.push(`${rule.count} times`);
  }

  return parts.join(" ");
}

/**
 * Convert recurrence rule to iCal RRULE format
 */
export function recurrenceToRRule(rule: RecurrenceRule): string {
  const parts: string[] = [];

  const freqMap: Record<string, string> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    biweekly: "WEEKLY",
    monthly: "MONTHLY",
    yearly: "YEARLY",
  };

  parts.push(`FREQ=${freqMap[rule.frequency]}`);

  if (rule.interval > 1 || rule.frequency === "biweekly") {
    parts.push(`INTERVAL=${rule.frequency === "biweekly" ? 2 : rule.interval}`);
  }

  if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const days = rule.daysOfWeek.map(d => dayMap[d]).join(",");
    parts.push(`BYDAY=${days}`);
  }

  if (rule.dayOfMonth) {
    parts.push(`BYMONTHDAY=${rule.dayOfMonth}`);
  }

  if (rule.endDate) {
    const endStr = rule.endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    parts.push(`UNTIL=${endStr}`);
  }

  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }

  return parts.join(";");
}

/**
 * Calculate next occurrence from recurrence rule
 */
export function getNextOccurrence(rule: RecurrenceRule, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + rule.interval);
      break;
    case "weekly":
    case "biweekly":
      const weekInterval = rule.frequency === "biweekly" ? 2 : rule.interval;
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find next matching day
        let found = false;
        for (let i = 1; i <= 14; i++) {
          const checkDate = new Date(fromDate);
          checkDate.setDate(checkDate.getDate() + i);
          if (rule.daysOfWeek.includes(checkDate.getDay())) {
            next.setTime(checkDate.getTime());
            found = true;
            break;
          }
        }
        if (!found) {
          next.setDate(next.getDate() + weekInterval * 7);
        }
      } else {
        next.setDate(next.getDate() + weekInterval * 7);
      }
      break;
    case "monthly":
      next.setMonth(next.getMonth() + rule.interval);
      if (rule.dayOfMonth) {
        next.setDate(rule.dayOfMonth);
      }
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + rule.interval);
      break;
  }

  return next;
}