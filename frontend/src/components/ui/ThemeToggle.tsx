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
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
}
