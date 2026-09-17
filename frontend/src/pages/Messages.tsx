import { useState, useEffect } from "react";
import { MessageAPI } from "../services/api";
import { useRole } from "../contexts/RoleContext";
import { Send, Inbox, MessageSquare, Clock, User, AlertCircle, Loader2 } from "lucide-react";

type Message = {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
};

export default function Messages() {
  const { currentRole } = useRole();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const [newMessage, setNewMessage] = useState({ receiver_id: "", content: "" });
  const [sending, setSending] = useState(false);

  // If user is Student or Parent, block access
  const isRestricted = currentRole === "Student" || currentRole === "Parent";

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = activeTab === "inbox" ? await MessageAPI.getInbox() : await MessageAPI.getSentMessages();
      setMessages(data);
      if (users.length === 0) {
        const uData = await MessageAPI.getAvailableUsers();
        setUsers(uData);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRestricted) {
      fetchMessages();
    }
  }, [activeTab, isRestricted]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await MessageAPI.sendMessage(newMessage.receiver_id, newMessage.content);
      setIsComposing(false);
      setNewMessage({ receiver_id: "", content: "" });
      if (activeTab === "sent") {
        fetchMessages();
      } else {
        setActiveTab("sent");
      }
    } catch (err: any) {
      alert("Failed to send message: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await MessageAPI.markAsRead(id);
      setMessages(messages.map(m => m.message_id === id ? { ...m, read_at: new Date().toISOString() } : m));
    } catch (e) {
      console.error(e);
    }
  };

  if (isRestricted) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="bg-surface p-8 rounded-3xl shadow-sm text-center border border-border">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary">Access Restricted</h2>
          <p className="text-secondary mt-2">Students and Parents do not have access to the internal messaging system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
            <MessageSquare className="text-indigo-600" size={32} />
            Internal Messaging
          </h1>
          <p className="text-secondary mt-1">Communicate securely with faculty and administration.</p>
        </div>
        <button
          onClick={() => setIsComposing(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Send size={18} /> Compose
        </button>
      </div>

      {isComposing && (
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border mb-6">
          <h2 className="text-lg font-bold text-primary mb-4">New Message</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">To</label>
              <select
                required
                value={newMessage.receiver_id}
                onChange={e => setNewMessage({ ...newMessage, receiver_id: e.target.value })}
                className="w-full bg-background border border-border rounded-xl p-3 text-primary outline-none focus:border-indigo-500"
              >
                <option value="" disabled>Select recipient...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role}{u.department ? ` - ${u.department}` : ''})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={newMessage.content}
                onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
                className="w-full bg-background border border-border rounded-xl p-3 text-primary outline-none focus:border-indigo-500 resize-none"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 text-secondary hover:text-primary font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !newMessage.receiver_id}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send Message
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "inbox" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" : "text-secondary hover:text-primary hover:bg-surface-secondary/50"}`}
          >
            <Inbox size={18} /> Inbox
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === "sent" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10" : "text-secondary hover:text-primary hover:bg-surface-secondary/50"}`}
          >
            <Send size={18} /> Sent
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-rose-500">
              <AlertCircle className="mb-2" size={32} />
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary opacity-70">
              <MessageSquare className="mb-3 opacity-50" size={48} />
              <p className="font-medium text-lg">No {activeTab} messages found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => {
                const isUnread = activeTab === "inbox" && !msg.read_at;
                return (
                  <div 
                    key={msg.message_id} 
                    onClick={() => isUnread && handleMarkRead(msg.message_id)}
                    className={`p-5 rounded-2xl border transition-all ${isUnread ? 'bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20 cursor-pointer shadow-sm' : 'bg-background border-border'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isUnread ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-surface-secondary text-secondary'}`}>
                          {activeTab === "inbox" ? msg.sender_name.charAt(0) : msg.receiver_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-primary">
                            {activeTab === "inbox" ? msg.sender_name : `To: ${msg.receiver_name}`}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-secondary mt-0.5">
                            {activeTab === "inbox" && <span className="flex items-center gap-1"><User size={12} /> {msg.sender_role}</span>}
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {isUnread && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2" />}
                    </div>
                    <p className="text-sm text-primary whitespace-pre-wrap ml-13 pl-[52px]">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
