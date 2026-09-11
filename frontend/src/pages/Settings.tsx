import { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Building, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [term, setTerm] = useState("2026-T1");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-indigo-600" size={28} />
          Account & Institutional Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your administrative profile, alert preferences, and active academic term view.
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 text-sm font-medium shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          Settings successfully updated.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User size={20} className="text-indigo-600" />
            Administrator Profile
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue="Dr. Sharma" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Role / Designation</label>
              <input 
                type="text" 
                disabled 
                defaultValue="Dean of Academics" 
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building size={20} className="text-indigo-600" />
            Institution & Department Scope
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">University Name</label>
              <input 
                type="text" 
                disabled 
                defaultValue="Vignan's Foundation for Science, Technology & Research" 
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Active Academic Term</label>
              <select 
                value={term} 
                onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="2026-T1">2026 Term 1 (Current)</option>
                <option value="2025-T2">2025 Term 2 (Archived)</option>
                <option value="2025-T1">2025 Term 1 (Archived)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-indigo-600" />
            Alert & Notification Preferences
          </h2>
          
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Email Notifications for Critical Exceptions</span>
                <span className="text-xs text-gray-500">Receive instant email alerts when Agent 10 detects a significant drop.</span>
              </div>
              <input 
                type="checkbox" 
                checked={emailAlerts} 
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>

            <div className="border-t border-gray-100 pt-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">SMS Alerts for Urgent HOD Reviews</span>
                  <span className="text-xs text-gray-500">Get text notifications for high-priority academic interventions.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={smsAlerts} 
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
