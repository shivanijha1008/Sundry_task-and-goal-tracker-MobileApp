import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      data-testid="theme-toggle-btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="nb-border nb-shadow-sm nb-press w-12 h-12 flex items-center justify-center rounded-md"
      style={{ background: theme === "dark" ? "#FFCC00" : "#0A0A0A", color: theme === "dark" ? "#0A0A0A" : "#FDFBF7" }}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={20} strokeWidth={3} /> : <Moon size={20} strokeWidth={3} />}
    </button>
  );
};
