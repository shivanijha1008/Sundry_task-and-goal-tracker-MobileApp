// Time-of-day smart suggestions
import { Droplet, Coffee, Footprints, Activity, Moon, Sun, BookOpen, Brain, Smile } from "lucide-react";

const ALL = [
  // morning
  { id: "water-am", title: "Drink water 💧", duration: 5, hours: [6, 7, 8, 9], icon: Droplet, mode: "countdown" },
  { id: "stretch-am", title: "Morning stretch 🧘", duration: 10, hours: [6, 7, 8], icon: Activity, mode: "countdown" },
  { id: "plan-am", title: "Plan your day 📒", duration: 10, hours: [7, 8, 9], icon: BookOpen, mode: "pomodoro" },
  // midday
  { id: "deepwork", title: "Deep work block 🧠", duration: 25, hours: [9, 10, 11, 14, 15, 16], icon: Brain, mode: "pomodoro" },
  { id: "walk", title: "Quick walk 🚶", duration: 10, hours: [11, 12, 13, 16], icon: Footprints, mode: "countdown" },
  { id: "lunch", title: "Lunch break 🍽️", duration: 30, hours: [12, 13], icon: Coffee, mode: "countdown" },
  // afternoon
  { id: "stand", title: "Stand & stretch 🤸", duration: 5, hours: [10, 14, 15, 16, 17], icon: Activity, mode: "countdown" },
  { id: "tea", title: "Tea break ☕", duration: 10, hours: [15, 16, 17], icon: Coffee, mode: "countdown" },
  // evening
  { id: "reflect", title: "Reflect on today 📝", duration: 10, hours: [18, 19, 20, 21], icon: BookOpen, mode: "pomodoro" },
  { id: "gratitude", title: "3 gratitudes 🙏", duration: 5, hours: [19, 20, 21, 22], icon: Smile, mode: "countdown" },
  { id: "winddown", title: "Wind down 🌙", duration: 15, hours: [21, 22, 23], icon: Moon, mode: "countdown" },
  // default
  { id: "focus-any", title: "Pomodoro focus", duration: 25, hours: null, icon: Sun, mode: "pomodoro" },
];

export function getSuggestions(now = new Date(), max = 4) {
  const h = now.getHours();
  const matched = ALL.filter((s) => !s.hours || s.hours.includes(h));
  const result = [];
  const ids = new Set();
  for (const s of matched) {
    if (ids.has(s.id)) continue;
    ids.add(s.id);
    result.push(s);
    if (result.length >= max) break;
  }
  return result;
}
