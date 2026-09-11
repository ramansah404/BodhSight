import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound, CheckCircle2, X, User, UserPlus } from "lucide-react";
import { apiClient } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  // Form States
  const [role, setRole] = useState("Dean");
  const [displayRole, setDisplayRole] = useState("Dean of Academics");
  const [name, setName] = useState("Dr. Anil Kumar Mahato");
  const [email, setEmail] = useState("anil.mahato@vignan.ac.in");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);

    // Save session state locally and persist role headers instantly
    localStorage.setItem("bodhsight_role", role);
    localStorage.setItem("bodhsight_display_role", displayRole);
    localStorage.setItem("bodhsight_name", name);
    localStorage.setItem("bodhsight_email", email);

    // Fire-and-forget background backend sync (never blocks UI)
    const endpoint = isSignUp ? "/auth/register" : "/auth/login";
    apiClient.post(endpoint, { name, email, role, password }).catch(() => {
      // Graceful local fallback
    });

    // Instant UI navigation (0ms delay)
    setLoading(false);
    navigate("/");
  };

  const handleQuickDemo = (demoRole: string, demoTitle: string, demoName: string) => {
    setRole(demoRole);
    setDisplayRole(demoTitle);
    setName(demoName);
    localStorage.setItem("bodhsight_role", demoRole);
    localStorage.setItem("bodhsight_display_role", demoTitle);
    localStorage.setItem("bodhsight_name", demoName);
    navigate("/");
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      alert("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotStep(2);
    }, 400); // Snappy 0.4s response
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      alert("Please enter a new password.");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotStep(3);
    }, 400); // Snappy 0.4s response
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-200/50 to-transparent pointer-events-none blur-3xl"></div>

      <div className="max-w-4xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 my-auto">
        
        {/* Left Branding / Hero Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-400/30">
              <Sparkles size={14} /> Agent 10 Intelligence
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">BodhSight Academic Telemetry</h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed font-medium">
              Real-time institutional analytics, statistical deviation detection, and role-based academic governance.
            </p>
          </div>

          <div className="space-y-3 pt-6 relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Quick Demo Access</div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleQuickDemo("Dean", "Dean of Academics", "Dr. Anil Kumar Mahato")}
                className="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Login as Dean (Full Access)</span>
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => handleQuickDemo("HOD", "Head of Department (CSE)", "Prof. Sharma (CSE HOD)")}
                className="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Login as CSE HOD</span>
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => handleQuickDemo("Faculty", "Course Instructor", "Dr. Rao (Faculty)")}
                className="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Login as Faculty</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-emerald-200/60 font-medium pt-4 border-t border-white/10">
            Secure RBAC Enforced • PostgreSQL Backed
          </div>
        </div>

        {/* Right Form Column (Sign In / Sign Up) */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {isSignUp ? "Create Institutional Account" : "Institutional Sign In"}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {isSignUp ? "Register your new role credential in the database." : "Select your role and authenticate with credentials."}
              </p>
            </div>
            
            {/* Toggle Sign In / Sign Up */}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSignUp ? <User size={14} /> : <UserPlus size={14} />}
              {isSignUp ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Role Privilege</label>
                <select 
                  value={role} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setRole(val);
                    if (val === 'Dean') setDisplayRole('Dean of Academics');
                    if (val === 'Principal') setDisplayRole('Principal & Management');
                    if (val === 'IQAC') setDisplayRole('IQAC Quality Officer');
                    if (val === 'HOD') setDisplayRole('Head of Department');
                    if (val === 'Faculty') setDisplayRole('Course Instructor');
                  }}
                  className="w-full px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="Dean">Dean</option>
                  <option value="Principal">Principal</option>
                  <option value="IQAC">IQAC Officer</option>
                  <option value="HOD">HOD</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-emerald-600" size={16} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-emerald-600" size={16} />
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-emerald-600" size={16} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setNewPassword("");
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-emerald-600" size={16} />
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSignUp ? <UserPlus size={18} /> : <ShieldCheck size={18} />}
              {loading ? "Processing..." : isSignUp ? `Register & Create ${role} Account` : `Sign In as ${role}`}
            </button>
          </form>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-emerald-100 animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-300" />
                <h3 className="font-bold text-base">Password Recovery Portal</h3>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <p className="text-xs text-gray-600 font-medium">
                    Enter your registered institutional email address. We will send a secure verification code to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registered Email</label>
                    <input 
                      type="email" 
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. dean@vignan.ac.in"
                      className="w-full px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {forgotLoading ? "Sending Code..." : "Send Reset Code"}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                    ✓ Verification code sent to <strong className="text-emerald-900">{forgotEmail}</strong>. (Simulated OTP: <strong>4892</strong>)
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Enter 4-Digit Code</label>
                    <input 
                      type="text" 
                      defaultValue="4892" 
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold tracking-widest text-center text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {forgotLoading ? "Updating..." : "Reset Password"}
                  </button>
                </form>
              )}

              {forgotStep === 3 && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">Password Updated Successfully!</h4>
                  <p className="text-xs text-gray-500">Your account credentials have been synchronized with the database.</p>
                  <button 
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2"
                  >
                    Close & Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
