import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Monitor, Settings, Users, AlertTriangle, MessageSquare, BookOpen, User } from "lucide-react";
import { Agent10API } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
      Agent10API.getAllStudents().then(setStudents).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const staticLinks = [
    { name: "Dashboard", path: "/dashboard", icon: Monitor },
    { name: "Student Directory & Analytics", path: "/students", icon: Users },
    { name: "Courses & Performance", path: "/courses", icon: BookOpen },
    { name: "Problems & Anomalies", path: "/anomalies", icon: AlertTriangle },
    { name: "Live Chat", path: "/messages", icon: MessageSquare },
    { name: "Settings & System", path: "/settings", icon: Settings },
  ];

  const searchLower = query.toLowerCase();
  
  const filteredLinks = staticLinks.filter((link) => 
    link.name.toLowerCase().includes(searchLower)
  );
  
  const filteredStudents = query.length > 1 
    ? students.filter((s) => 
        s.full_name.toLowerCase().includes(searchLower) || 
        s.roll_no.toLowerCase().includes(searchLower)
      ).slice(0, 5)
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: -20 }} 
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center px-4 py-3 border-b border-border/50">
            <Search className="text-secondary mr-3" size={20} />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-lg text-primary placeholder-secondary"
              placeholder="Search students, courses, or pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase bg-surface-secondary px-2 py-1 rounded">
              ESC
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.length === 0 && (
              <div className="px-3 py-2 text-xs font-bold text-secondary uppercase tracking-wider">
                Quick Links
              </div>
            )}
            
            {filteredLinks.length > 0 && (
              <div className="mb-4">
                {query.length > 0 && (
                  <div className="px-3 py-2 text-xs font-bold text-secondary uppercase tracking-wider">Pages</div>
                )}
                {filteredLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleSelect(link.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-secondary/50 text-left transition-colors group"
                    >
                      <div className="p-1.5 bg-surface-secondary group-hover:bg-indigo-500/10 rounded-lg text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-medium text-primary">{link.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredStudents.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-bold text-secondary uppercase tracking-wider">Students</div>
                {filteredStudents.map((student) => (
                  <button
                    key={student.student_id}
                    onClick={() => handleSelect("/students")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-secondary/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-surface-secondary group-hover:bg-rose-500/10 rounded-lg text-secondary group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary">{student.full_name}</div>
                        <div className="text-xs text-secondary font-mono mt-0.5">{student.roll_no} • {student.section_code}</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                      CGPA: {student.cgpa.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length > 0 && filteredLinks.length === 0 && filteredStudents.length === 0 && (
              <div className="py-12 text-center text-secondary">
                <Search className="mx-auto mb-3 opacity-20" size={32} />
                <p className="text-sm font-medium">No results found for "{query}"</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
