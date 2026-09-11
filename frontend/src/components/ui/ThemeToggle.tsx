import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext'; export default function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return ( <button onClick={toggleTheme} className="p-2 rounded-xl bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-indigo-100 border border-border flex items-center justify-center" aria-label="Toggle Theme" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`} > {theme === 'dark' ? ( <Sun size={18} /> ) : ( <Moon size={18} /> )} </button> );
}
