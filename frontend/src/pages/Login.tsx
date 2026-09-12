import BrandLogo from "../components/ui/BrandLogo";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound,
  CheckCircle2, X, User, UserPlus, Fingerprint, MoveLeft,
  ChevronDown
} from "lucide-react";

/**
 * Login page — institutional sign-in.
 * Features a custom dropdown, polished transitions, and strict 4-role RBAC.
 */

const ROLE_OPTIONS = [
  { code: "Chairman",   label: "Chairman / Board",        display: "Chairman", desc: "Institutional Overview", icon: ShieldCheck },
  { code: "Principal",  label: "Principal",               display: "Principal", desc: "Academic Leadership", icon: ShieldCheck },
  { code: "Dean",       label: "Dean of Academics",       display: "Dean",     desc: "Academic Management", icon: Lock },
  { code: "HOD",        label: "Head of Department",      display: "HOD",      desc: "Departmental View", icon: User },
  { code: "Faculty",    label: "Course Instructor",       display: "Faculty",  desc: "Course Management", icon: UserPlus },
  { code: "IQAC",       label: "Quality Assurance",       display: "IQAC",     desc: "Evidence & Quality", icon: CheckCircle2 },
];

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  const [roleCode, setRoleCode] = useState("Chairman");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("Dr. K. Vignan");
  const [email, setEmail] = useState("chairman@vignan.ac.in");
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startSession = (code: string, displayLabel: string, displayName: string, userEmail: string) => {
    localStorage.setItem("bodhsight_role", code);
    localStorage.setItem("bodhsight_display_role", displayLabel);
    localStorage.setItem("bodhsight_name", displayName);
    localStorage.setItem("bodhsight_email", userEmail);
    if (code === "HOD" || code === "Faculty") {
      localStorage.setItem("bodhsight_department", "CSE");
    } else {
      localStorage.removeItem("bodhsight_department");
    }
    navigate("/dashboard");
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
    setTimeout(() => {
      startSession(selectedRole.code, selectedRole.label, name.trim(), email.trim());
      setLoading(false);
    }, 800);
  };

  const handleQuickDemo = (code: string, label: string, demoName: string) => {
    const demoEmail = `${code.toLowerCase()}@vignan.ac.in`;
    startSession(code, label, demoName, demoEmail);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { alert("Please enter your registered email address."); return; }
    setForgotLoading(true);
    setTimeout(() => { setForgotLoading(false); setForgotStep(2); }, 800);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) { alert("Please enter a new password."); return; }
    setForgotLoading(true);
    setTimeout(() => { setForgotLoading(false); setForgotStep(3); }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden relative transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px]" />
      </div>

      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors cursor-pointer z-20 group"
      >
        <MoveLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to BodhSight
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-5xl w-full bg-surface backdrop-blur-2xl rounded-3xl shadow-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 my-auto"
      >
        {/* Left Branding Column */}
        <div className="md:col-span-5 bg-surface-secondary/50 p-8 md:p-12 border-r border-border flex flex-col justify-between relative overflow-hidden">
          
          <div className="space-y-6 relative z-10">
            <BrandLogo className="mb-8 scale-110 origin-left" />
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" /> Secure Gateway
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome to<br/>BodhSight.</h1>
              <p className="text-secondary text-sm leading-relaxed font-medium">
                Authenticate your institutional credentials to access secure academic telemetry and Agent 10 analytics.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-10 relative z-10">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary">Quick Access (Demo)</div>
            <div className="space-y-2">
              {[
                { code: "Chairman", label: "Chairman / Board",    name: "Dr. K. Vignan", desc: "Login as Chairman" },
                { code: "Principal",label: "Principal",           name: "Dr. S. Reddy",  desc: "Login as Principal" },
                { code: "Dean",    label: "Dean of Academics",    name: "Dr. Anil Kumar Mahato", desc: "Login as Dean" },
                { code: "HOD",     label: "Head of Department",   name: "Prof. Sharma (CSE)", desc: "Login as HOD" },
                { code: "Faculty", label: "Course Instructor",    name: "Dr. Rao", desc: "Login as Faculty" },
                { code: "IQAC",    label: "Quality Assurance",    name: "Dr. Meena (IQAC)", desc: "Login as IQAC" },
              ].map((demo) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={demo.code}
                  onClick={() => handleQuickDemo(demo.code, demo.label, demo.name)}
                  className="w-full text-left px-4 py-3 bg-background hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 border border-border hover:border-indigo-500/30 rounded-xl text-xs font-medium text-primary transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Fingerprint size={14} className="text-secondary group-hover:text-indigo-500 dark:group-hover:text-indigo-600 dark:text-indigo-400 transition-colors" />
                    {demo.desc}
                  </span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all text-indigo-500 dark:text-indigo-400" />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-secondary font-medium pt-8 mt-4 border-t border-border">
            Encrypted RBAC Session • Powered by PostgreSQL
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-surface">
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                {isSignUp ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-sm text-secondary mt-1">
                {isSignUp
                  ? "Register your credentials."
                  : "Enter your details to proceed."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSignUp ? <User size={14} /> : <UserPlus size={14} />}
              {isSignUp ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Custom Role Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Access Level
                </label>
                <div 
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {selectedRole.icon && <selectedRole.icon size={16} className="text-indigo-500" />}
                    {selectedRole.display}
                  </div>
                  <ChevronDown size={16} className={`text-secondary transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                <AnimatePresence>
                  {isRoleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-20"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <div
                          key={r.code}
                          onClick={() => {
                            setRoleCode(r.code);
                            setIsRoleDropdownOpen(false);
                            // Pre-fill email/name logic for convenience in demo
                            if(r.code === "Chairman") { setName("Dr. K. Vignan"); setEmail("chairman@vignan.ac.in"); }
                            if(r.code === "Principal") { setName("Dr. S. Reddy"); setEmail("principal@vignan.ac.in"); }
                            if(r.code === "Dean") { setName("Dr. Anil Kumar Mahato"); setEmail("dean@vignan.ac.in"); }
                            if(r.code === "HOD") { setName("Prof. Sharma"); setEmail("hod@vignan.ac.in"); }
                            if(r.code === "Faculty") { setName("Dr. Rao"); setEmail("faculty@vignan.ac.in"); }
                            if(r.code === "IQAC") { setName("Dr. Meena"); setEmail("iqac@vignan.ac.in"); }
                          }}
                          className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${roleCode === r.code ? 'bg-indigo-500/10' : 'hover:bg-surface-secondary'}`}
                        >
                          <r.icon size={16} className={roleCode === r.code ? 'text-indigo-500' : 'text-secondary'} />
                          <div>
                            <div className={`text-sm font-semibold ${roleCode === r.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-primary'}`}>{r.display}</div>
                            <div className="text-[10px] text-secondary">{r.desc}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-secondary" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary placeholder:text-secondary/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-secondary" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary placeholder:text-secondary/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-secondary" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary placeholder:text-secondary/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                  required
                />
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(email); setForgotStep(1); setNewPassword(""); setShowForgotModal(true); }}
                    className="text-xs font-medium text-secondary hover:text-indigo-600 dark:hover:text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2 mt-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-secondary" size={16} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary placeholder:text-secondary/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSignUp ? <UserPlus size={18} /> : <ShieldCheck size={18} />}
              {loading ? "Authenticating…" : isSignUp ? `Register as ${selectedRole.display}` : `Sign In to Dashboard`}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface rounded-3xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface-secondary">
                <div className="flex items-center gap-3 text-primary font-semibold">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <KeyRound size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Account Recovery
                </div>
                <button onClick={() => setShowForgotModal(false)} className="text-secondary hover:text-primary transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {forgotStep === 1 && (
                    <motion.form key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendResetLink} className="space-y-5">
                      <p className="text-sm text-secondary">Enter your registered institutional email address to receive a secure reset code.</p>
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase mb-2">Registered Email</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="dean@vignan.ac.in"
                          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-primary focus:border-indigo-500 focus:outline-none shadow-sm"
                          required
                        />
                      </div>
                      <button type="submit" disabled={forgotLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm">
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </motion.form>
                  )}

                  {forgotStep === 2 && (
                    <motion.form key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleUpdatePassword} className="space-y-5">
                      <div className="bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                        Code sent to <strong>{forgotEmail}</strong>.<br/>(Demo code: <strong>4892</strong>)
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase mb-2">Security Code</label>
                        <input type="text" defaultValue="4892" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-base font-bold tracking-[0.2em] text-center text-primary focus:border-indigo-500 focus:outline-none shadow-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase mb-2">New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-primary focus:border-indigo-500 focus:outline-none shadow-sm" required />
                      </div>
                      <button type="submit" disabled={forgotLoading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm">
                        {forgotLoading ? "Updating..." : "Update Password"}
                      </button>
                    </motion.form>
                  )}

                  {forgotStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-500/10">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-primary mb-1">Password Updated</h4>
                        <p className="text-sm text-secondary">Your institutional credentials have been successfully securely updated.</p>
                      </div>
                      <button onClick={() => setShowForgotModal(false)} className="w-full py-2.5 bg-surface-secondary text-primary hover:bg-surface-hover rounded-xl text-sm font-bold transition-colors cursor-pointer mt-4">
                        Return to Sign In
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
