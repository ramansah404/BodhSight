<<<<<<< HEAD
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme} 
      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
      aria-label="Toggle Theme" 
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
=======
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/80 text-primary shadow-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="transition-transform duration-300 hover:rotate-12">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
>>>>>>> 0d27828 (merge latest main with UI improvements)
    </button>
  );
}
