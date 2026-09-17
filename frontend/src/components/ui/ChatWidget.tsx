import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Bot, User, Maximize2, Minimize2 } from "lucide-react";
import { Agent10API } from "../../services/api";
import { useFilters } from "../../contexts/FilterContext";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "agent", text: "Hello! I am Agent 10. How can I assist you with Academic Agent today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { filters } = useFilters();
  const userRole = localStorage.getItem("bodhsight_role") || "Unknown";

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: "user", text: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      const response = await Agent10API.sendChatMessage(userMsg, filters);
      setMessages([...newMessages, { id: Date.now().toString() + "_resp", role: "agent", text: response.reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Sorry, I am currently offline or encountered an error.";
      setMessages([...newMessages, { id: Date.now().toString() + "_err", role: "agent", text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        drag
        dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
        dragMomentum={false}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-800 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-colors cursor-grab active:cursor-grabbing"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => isMaximized ? setIsMaximized(false) : setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed ${isMaximized ? 'inset-4 w-auto h-auto max-w-none max-h-none' : 'bottom-6 right-6 w-96 h-[32rem] max-w-[calc(100vw-3rem)]'} bg-surface rounded-3xl shadow-2xl border border-border/80 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}
            >
              {/* Header */}
              <div className="bg-teal-800 text-white p-4 flex justify-between items-center shadow-md z-10 relative">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-white shadow-lg rounded-xl overflow-hidden group border border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 opacity-10 group-hover:opacity-20 transition-opacity" />
                    <Bot size={22} className="text-indigo-600 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Agent 10</h3>
                    <p className="text-[10px] text-teal-100 font-medium">Logged in as {userRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsMaximized(!isMaximized)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "user" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"}`}>
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"}`}>
                      {msg.role === "agent" ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-snug max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-3 bg-surface border-t border-border">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Agent 10..."
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-3 text-slate-700 dark:text-slate-200"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
