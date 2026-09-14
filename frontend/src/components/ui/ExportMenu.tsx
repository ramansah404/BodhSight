import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, File as FileWord, ChevronDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExportMenuProps {
  onExportExcel?: () => Promise<void> | void;
  onExportPDF?: () => Promise<void> | void;
  onExportWord?: () => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

export default function ExportMenu({ onExportExcel, onExportPDF, onExportWord, className = "", disabled = false }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [activeExport, setActiveExport] = useState<"excel" | "pdf" | "word" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (type: "excel" | "pdf" | "word", exportFn?: () => Promise<void> | void) => {
    if (!exportFn || disabled) return;
    
    setExportState("loading");
    setActiveExport(type);
    
    try {
      await exportFn();
      setExportState("success");
      
      // Auto-reset and close after success
      setTimeout(() => {
        setExportState("idle");
        setIsOpen(false);
        setActiveExport(null);
      }, 2000);
    } catch (error) {
      setExportState("error");
      setTimeout(() => {
        setExportState("idle");
        setActiveExport(null);
      }, 3000);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm font-semibold transition-all shadow-sm ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer text-primary"
        }`}
      >
        <Download size={16} className="text-secondary" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-[200] flex flex-col p-1"
          >
            {/* EXCEL */}
            {onExportExcel && (
              <button
                onClick={() => handleExport("excel", onExportExcel)}
                disabled={exportState === "loading"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full
                  ${activeExport === "excel" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "hover:bg-surface-secondary text-primary"}
                  ${exportState === "loading" ? "cursor-wait opacity-70" : "cursor-pointer"}
                `}
              >
                {activeExport === "excel" && exportState === "loading" ? (
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                ) : activeExport === "excel" && exportState === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : activeExport === "excel" && exportState === "error" ? (
                  <AlertCircle size={16} className="text-rose-500" />
                ) : (
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                )}
                Excel (.xlsx)
              </button>
            )}

            {/* PDF */}
            {onExportPDF && (
              <button
                onClick={() => handleExport("pdf", onExportPDF)}
                disabled={exportState === "loading"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full
                  ${activeExport === "pdf" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "hover:bg-surface-secondary text-primary"}
                  ${exportState === "loading" ? "cursor-wait opacity-70" : "cursor-pointer"}
                `}
              >
                {activeExport === "pdf" && exportState === "loading" ? (
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                ) : activeExport === "pdf" && exportState === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : activeExport === "pdf" && exportState === "error" ? (
                  <AlertCircle size={16} className="text-rose-500" />
                ) : (
                  <FileText size={16} className="text-rose-500" />
                )}
                PDF Report
              </button>
            )}

            {/* WORD */}
            {onExportWord && (
              <button
                onClick={() => handleExport("word", onExportWord)}
                disabled={exportState === "loading"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full
                  ${activeExport === "word" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "hover:bg-surface-secondary text-primary"}
                  ${exportState === "loading" ? "cursor-wait opacity-70" : "cursor-pointer"}
                `}
              >
                {activeExport === "word" && exportState === "loading" ? (
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                ) : activeExport === "word" && exportState === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : activeExport === "word" && exportState === "error" ? (
                  <AlertCircle size={16} className="text-rose-500" />
                ) : (
                  <FileWord size={16} className="text-blue-500" />
                )}
                Word (.docx)
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
