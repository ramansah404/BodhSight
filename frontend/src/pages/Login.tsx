import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound,
  CheckCircle2, X, User, UserPlus
} from "lucide-react";

/**
 * Login page — institutional sign-in.
 *
 * Auth model: role-based localStorage session.
 * The backend has no /auth/login endpoint; authentication is handled
 * entirely on the client side via role selection.
 * Role determines which pages and actions are available (RBAC).
 */

const ROLE_OPTIONS = [
  { code: "Dean",       label: "Dean of Academics",       display: "Dean" },
  { code: "Principal",  label: "Principal & Management",  display: "Principal" },
  { code: "IQAC",       label: "IQAC Quality Officer",    display: "IQAC Officer" },
  { code: "HOD",        label: "Head of Department",      display: "HOD" },
  { code: "Faculty",    label: "Course Instructor",       display: "Faculty" },
];

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  const [roleCode, setRoleCode] = useState("Dean");
  const [name, setName] = useState("Dr. Anil Kumar Mahato");
  const [email, setEmail] = useState("anil.mahato@vignan.ac.in");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const selectedRole = ROLE_OPTIONS.find((r) => r.code === roleCode) ?? ROLE_OPTIONS[0];

  const startSession = (code: string, displayLabel: string, displayName: string) => {
    localStorage.setItem("bodhsight_role", code);
    localStorage.setItem("bodhsight_display_role", displayLabel);
    localStorage.setItem("bodhsight_name", displayName);
    localStorage.setItem("bodhsight_email", email);
    navigate("/");
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    // Session is localStorage-based — no backend auth endpoint exists
    setTimeout(() => {
      startSession(selectedRole.code, selectedRole.label, name.trim());
      setLoading(false);
    }, 300);
  };

  const handleQuickDemo = (code: string, label: string, demoName: string) => {
    localStorage.setItem("bodhsight_role", code);
    localStorage.setItem("bodhsight_display_role", label);
    localStorage.setItem("bodhsight_name", demoName);
    localStorage.setItem("bodhsight_email", `${code.toLowerCase()}@vignan.ac.in`);
    navigate("/");
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { alert("Please enter your registered email address."); return; }
    setForgotLoading(true);
    setTimeout(() => { setForgotLoading(false); setForgotStep(2); }, 500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) { alert("Please enter a new password."); return; }
    setForgotLoading(true);
    setTimeout(() => { setForgotLoading(false); setForgotStep(3); }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-200/50 to-transparent pointer-events-none blur-3xl" />

      <div className="max-w-4xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 my-auto">

        {/* Left Branding Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-2xl" />

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
              {[
                { code: "Dean",    label: "Dean of Academics",    name: "Dr. Anil Kumar Mahato", desc: "Login as Dean (Full Access)" },
                { code: "HOD",     label: "Head of Department",   name: "Prof. Sharma (CSE HOD)", desc: "Login as CSE HOD" },
                { code: "Faculty", label: "Course Instructor",    name: "Dr. Rao (Faculty)", desc: "Login as Faculty" },
              ].map((demo) => (
                <button
                  key={demo.code}
                  onClick={() => handleQuickDemo(demo.code, demo.label, demo.name)}
                  className="w-full text-left px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{demo.desc}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-emerald-200/60 font-medium pt-4 border-t border-white/10">
            Secure RBAC Enforced • PostgreSQL Backed
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {isSignUp ? "Create Institutional Account" : "Institutional Sign In"}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {isSignUp
                  ? "Register your role credential to access analytics."
                  : "Select your role and authenticate to access the dashboard."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSignUp ? <User size={14} /> : <UserPlus size={14} />}
              {isSignUp ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Role Privilege
                </label>
                <select
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.display}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
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

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
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
                    onClick={() => { setForgotEmail(email); setForgotStep(1); setNewPassword(""); setShowForgotModal(true); }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* Confirm Password (sign-up only) */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
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
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSignUp ? <UserPlus size={18} /> : <ShieldCheck size={18} />}
              {loading ? "Signing in…" : isSignUp ? `Register as ${selectedRole.display}` : `Sign In as ${selectedRole.display}`}
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
              <button onClick={() => setShowForgotModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <p className="text-xs text-gray-600 font-medium">Enter your registered institutional email address.</p>
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
                    {forgotLoading ? "Sending…" : "Send Reset Code"}
                  </button>
                </form>
              )}
              {forgotStep === 2 && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                    ✓ Verification code sent to <strong>{forgotEmail}</strong>. (Demo OTP: <strong>4892</strong>)
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Enter 4-Digit Code</label>
                    <input type="text" defaultValue="4892" className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold tracking-widest text-center text-gray-900" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                    {forgotLoading ? "Updating…" : "Reset Password"}
                  </button>
                </form>
              )}
              {forgotStep === 3 && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">Password Updated Successfully!</h4>
                  <p className="text-xs text-gray-500">Your credentials have been updated.</p>
                  <button onClick={() => setShowForgotModal(false)} className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer mt-2">
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
