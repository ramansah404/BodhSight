import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-surface/80 px-2 text-primary shadow-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="flex items-center transition-transform duration-300 hover:rotate-12">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </span>
    </button>
  );
}
