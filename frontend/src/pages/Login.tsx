import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, BrainCircuit, Lock, User, ChevronRight, BarChart3, AlertTriangle, Lightbulb, Sun, Moon, ArrowRight, KeyRound, Smartphone } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isDark, setIsDark] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form State
  const [role, setRole] = useState("Dean");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const roles = [
    { id: "Principal", label: "Principal" },
    { id: "Management", label: "Management Board" },
    { id: "IQAC", label: "IQAC Officer" },
    { id: "Dean", label: "Dean of Academics" },
    { id: "HOD", label: "Head of Department" },
    { id: "Faculty", label: "Course Instructor" }
  ];

  const handleDemoBypass = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    setTimeout(() => {
      // Map macro roles to 'Dean' for dashboard routing, but keep display role intact
      const dashboardRole = (role === "Principal" || role === "Management" || role === "IQAC") ? "Dean" : role;
      const formattedName = `${role} ${name.trim() || "User"}`;
      
      localStorage.setItem("bodhsight_role", dashboardRole);
      localStorage.setItem("bodhsight_display_role", role);
      localStorage.setItem("bodhsight_name", formattedName);
      
      navigate("/");
    }, 1000);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 overflow-x-hidden font-sans ${isDark ? 'bg-[#05050A] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 top-0 border-b transition-all duration-300 backdrop-blur-lg ${isDark ? 'bg-[#05050A]/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-indigo-600" size={24} />
            <span className={`text-lg font-black tracking-widest uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>BodhSight</span>
            <span className="ml-2 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 hidden sm:inline-block">Agent 10</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)} 
              className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20 hover:rotate-45' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200 hover:-rotate-45'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:min-h-screen flex items-center">
        <div className={`absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-300/40'}`}></div>
        <div className={`absolute bottom-10 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[120px] pointer-events-none transition-colors duration-700 ${isDark ? 'bg-violet-600/10' : 'bg-violet-300/40'}`}></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          
          <div className="space-y-6">
            <h1 className={`text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Academic Data. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">AI Precision.</span>
            </h1>
            <p className={`text-lg max-w-md leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Agent 10 transforms scattered spreadsheets into actionable institutional intelligence. Select your role to experience role-based access control.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <a href="#features" className={`flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}>
                Explore Capabilities <ChevronRight size={16} />
              </a>
            </div>
          </div>

          {/* Smooth Auth Card */}
          <div className={`backdrop-blur-xl p-8 rounded-3xl transition-all duration-500 border ${isDark ? 'bg-white/5 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_20px_60px_rgba(79,70,229,0.1)]'}`}>
            
            <div className={`flex gap-6 border-b mb-6 pb-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button onClick={() => setAuthMode("signin")} className={`text-sm font-bold pb-2 -mb-[9px] transition-colors ${authMode === 'signin' ? (isDark ? 'text-white border-b-2 border-indigo-500' : 'text-indigo-600 border-b-2 border-indigo-600') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                Sign In
              </button>
              <button onClick={() => setAuthMode("signup")} className={`text-sm font-bold pb-2 -mb-[9px] transition-colors ${authMode === 'signup' ? (isDark ? 'text-white border-b-2 border-indigo-500' : 'text-indigo-600 border-b-2 border-indigo-600') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                Sign Up
              </button>
            </div>

            <form onSubmit={handleDemoBypass} className="space-y-4">
              
              {/* Role Dropdown */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <label className={`text-xs font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Institutional Role</label>
                <div className="mt-1 relative">
                  <Shield size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${isDark ? 'bg-[#0B0F19] border border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Name Input */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
                <label className={`text-xs font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Your Name</label>
                <div className="mt-1 relative">
                  <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input required value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="e.g. Dr. Sharma" className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-[#0B0F19] border border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'}`} />
                </div>
              </div>

              {/* Email / Phone Input */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                <label className={`text-xs font-bold ml-1 flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Email or Phone Number</span>
                </label>
                <div className="mt-1 relative">
                  <Smartphone size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input value={contact} onChange={(e) => setContact(e.target.value)} type="text" placeholder="admin@university.edu or +91..." className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-[#0B0F19] border border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'}`} />
                </div>
              </div>

              {/* Password Input */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <label className={`text-xs font-bold ml-1 flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Password</span>
                  {authMode === "signin" && (
                    <button type="button" className={`hover:underline flex items-center gap-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      <KeyRound size={12} /> Forgot Password?
                    </button>
                  )}
                </label>
                <div className="mt-1 relative">
                  <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input type="password" placeholder="••••••••" className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-[#0B0F19] border border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20'}`} />
                </div>
              </div>

              {/* One-Click Hackathon Demo Button */}
              <div className="pt-2 animate-in fade-in duration-500 delay-200">
                <button type="submit" disabled={isLoggingIn} className={`w-full font-bold py-3 rounded-xl transition-all shadow-md text-sm flex justify-center items-center gap-2 group ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
                  {isLoggingIn ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {authMode === "signin" ? "Login & Enter Dashboard" : "Register & Enter Dashboard"}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className={`text-center text-[10px] font-bold uppercase tracking-wider mt-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hackathon Demo: Password validation bypassed
                </p>
              </div>
            </form>

          </div>
        </div>
      </section>

      {/* Scrollable Content Below Fold */}
      <section id="features" className={`py-24 border-t transition-colors duration-300 ${isDark ? 'border-white/5 bg-gradient-to-b from-[#0B0F19] to-[#05050A]' : 'border-slate-200 bg-gradient-to-b from-slate-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Agent 10 Intelligence Engine</h2>
            <p className={`text-sm mt-3 max-w-xl mx-auto font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Powered by FastAPI and PostgreSQL, executing heuristic attribution and multi-dimensional slicing at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-6 rounded-3xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${isDark ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                <BarChart3 size={24} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Multi-Dimensional Slicing</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Instantly slice academic performance by regulation, batch, gender, entry qualification, and admission category.</p>
            </div>
            
            <div className={`p-6 rounded-3xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${isDark ? 'bg-rose-500/20 border-rose-500/30' : 'bg-rose-50 border-rose-100'}`}>
                <AlertTriangle size={24} className={isDark ? 'text-rose-400' : 'text-rose-600'} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Statistical Deviations</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No eyeballing. Identifies persistent underperformance and sudden drops using automated Z-score baselining.</p>
            </div>
            
            <div className={`p-6 rounded-3xl border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100'}`}>
                <Lightbulb size={24} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contextual Attribution</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Agent 10 distinguishes systemic issues (hard question papers) from localized variance (single section drops).</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
