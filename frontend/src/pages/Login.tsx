import BrandLogo from "../components/ui/BrandLogo";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, KeyRound,
  CheckCircle2, X, User, UserPlus, Fingerprint, MoveLeft,
  ChevronDown, Phone, Building2, Eye, EyeOff,
} from "lucide-react";
import { AuthAPI } from "../services/api";
import axios from "axios";

/**
 * Login page — institutional sign-in with database-backed authentication.
 * - Sign Up: stores credentials securely in PostgreSQL (bcrypt hashed).
 * - Sign In: verifies credentials against the database.
 * - Demo buttons: bypass auth for quick demonstrations.
 */

const ROLE_OPTIONS = [
  { code: "Chairman",  label: "Chairman / Board",     display: "Chairman", desc: "Institutional Overview", icon: ShieldCheck },
  { code: "Principal", label: "Principal",             display: "Principal", desc: "Academic Leadership",   icon: ShieldCheck },
  { code: "Dean",      label: "Dean of Academics",    display: "Dean",      desc: "Academic Management",   icon: Lock },
  { code: "HOD",       label: "Head of Department",   display: "HOD",       desc: "Departmental View",     icon: User },
  { code: "Faculty",   label: "Course Instructor",    display: "Faculty",   desc: "Course Management",     icon: UserPlus },
  { code: "IQAC",      label: "Quality Assurance",    display: "IQAC",      desc: "Evidence & Quality",    icon: CheckCircle2 },
];

const DEPT_OPTIONS = ["CSE", "ME", "ECE", "EEE", "CE", "IT", "MBA", "MCA"];

type IdentifierMode = "email" | "phone";

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  // Role selector
  const [roleCode, setRoleCode] = useState("Chairman");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Identifier mode: email or phone
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>("email");

  // Form fields
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [newPassword, setNewPassword] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // OTP Mode
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpContext, setOtpContext] = useState<"login" | "signup">("login");

  const selectedRole = ROLE_OPTIONS.find((r) => r.code === roleCode) ?? ROLE_OPTIONS[0];
  const needsDept = roleCode === "HOD" || roleCode === "Faculty";

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

  // If already logged in, skip the login page entirely
  useEffect(() => {
    const role = localStorage.getItem("bodhsight_role");
    if (role === "Admin") {
      navigate("/admin/users", { replace: true });
    } else if (role) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);


  // Clear form when switching modes
  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setError("");
    setSuccess("");
  }, [isSignUp]);

  const startSession = (code: string, displayLabel: string, displayName: string, userEmail: string, dept?: string | null, token?: string) => {
    localStorage.setItem("bodhsight_role", code);
    localStorage.setItem("bodhsight_display_role", displayLabel);
    localStorage.setItem("bodhsight_name", displayName);
    localStorage.setItem("bodhsight_email", userEmail);
    if (token) {
      localStorage.setItem("bodhsight_token", token);
    }
    if (dept) {
      localStorage.setItem("bodhsight_department", dept);
    } else {
      localStorage.removeItem("bodhsight_department");
    }
    
    if (code === "Admin") {
      navigate("/admin/users");
    } else {
      navigate("/dashboard");
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // --- Client-side validation ---
    if (!identifier.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isSignUp) {
      if (!name.trim()) { setError("Full name is required."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters for security."); return; }
      if (identifierMode === "email" && !identifier.includes("@")) {
        setError("Please enter a valid email address."); return;
      }
      if (identifierMode === "phone" && !/^\+?[0-9]{10,15}$/.test(identifier.replace(/\s/g, ""))) {
        setError("Please enter a valid phone number (10-15 digits)."); return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // --- SIGN UP: create account in database ---
        const payload: Parameters<typeof AuthAPI.signup>[0] = {
          full_name: name.trim(),
          password,
          role: roleCode,
          department: needsDept ? department : undefined,
        };
        if (identifierMode === "email") payload.email = identifier.trim().toLowerCase();
        else payload.phone_number = identifier.trim();

        const res = await AuthAPI.signup(payload);
        if (res.success && res.requires_2fa) {
          setSuccess("OTP sent! Please verify to complete registration.");
          setIsOtpMode(true);
          setOtpSent(true);
          setOtpContext("signup");
        }
      } else {
        // --- SIGN IN: verify credentials against database ---
        const res = await AuthAPI.login({ identifier: identifier.trim(), password });
        if (res.success) {
          if (res.requires_2fa) {
            setSuccess("2FA Required. Please check your email or phone for the OTP.");
            setIsOtpMode(true);
            setOtpSent(true);
            setOtpContext("login");
            return;
          }

          const role = ROLE_OPTIONS.find(r => r.code === res.role);
          startSession(
            res.role ?? "Faculty",
            role?.label ?? res.role ?? "User",
            res.full_name ?? "User",
            res.email ?? identifier,
            res.department,
          );
        }
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Authentication failed. Please try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!identifier.trim()) { setError("Please enter your email or phone number."); return; }
    
    setLoading(true);
    try {
      const res = await AuthAPI.requestOtp({ identifier: identifier.trim() });
      if (res.success) {
        setSuccess(res.message);
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!otp.trim()) { setError("Please enter the OTP."); return; }
    
    setLoading(true);
    try {
      if (otpContext === "login") {
        const res = await AuthAPI.verifyOtp({ identifier: identifier.trim(), otp: otp.trim() });
        if (res.success) {
          const role = ROLE_OPTIONS.find(r => r.code === res.role);
          startSession(
            res.role ?? "Faculty",
            role?.label ?? res.role ?? "User",
            res.full_name ?? "User",
            res.email ?? identifier,
            res.department,
          );
        }
      } else {
        const res = await AuthAPI.verifySignup({ identifier: identifier.trim(), otp: otp.trim() });
        if (res.success) {
          const role = ROLE_OPTIONS.find(r => r.code === res.role);
          startSession(
            res.role ?? "Faculty",
            role?.label ?? res.role ?? "User",
            res.full_name ?? "User",
            res.email ?? identifier,
            res.department,
          );
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (code: string, label: string, demoName: string) => {
    const demoEmail = `${code.toLowerCase()}@vignan.ac.in`;
    const dept = (code === "HOD" || code === "Faculty") ? "CSE" : undefined;
    startSession(code, label, demoName, demoEmail, dept);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError("Please enter your registered email address."); return; }
    setForgotLoading(true);
    try {
      await AuthAPI.forgotPassword({ identifier: forgotEmail.trim() });
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.detail || "Failed to send reset link.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotOtp) { setForgotError("Please enter the OTP."); return; }
    if (!newPassword || newPassword.length < 8) { setForgotError("Password must be at least 8 characters."); return; }
    setForgotLoading(true);
    try {
      await AuthAPI.resetPassword({ identifier: forgotEmail.trim(), otp: forgotOtp.trim(), new_password: newPassword });
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary placeholder:text-secondary/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300">

      {/* Top Navigation */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
        <ThemeToggle showLabel />
      </div>

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
                { code: "Chairman", label: "Chairman / Board",  name: "Dr. K. Vignan",           desc: "Login as Chairman" },
                { code: "Principal",label: "Principal",         name: "Dr. S. Reddy",             desc: "Login as Principal" },
                { code: "Dean",     label: "Dean of Academics", name: "Dr. Anil Kumar Mahato",    desc: "Login as Dean" },
                { code: "HOD",      label: "Head of Department",name: "Prof. Sharma (CSE)",        desc: "Login as HOD" },
                { code: "Faculty",  label: "Course Instructor", name: "Dr. Rao",                   desc: "Login as Faculty" },
                { code: "IQAC",     label: "Quality Assurance", name: "Dr. Meena (IQAC)",          desc: "Login as IQAC" },
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
            bcrypt-encrypted credentials • PostgreSQL-backed • RBAC session
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
                  ? "Register your institutional credentials securely."
                  : "Enter your credentials to access the dashboard."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSignUp ? <User size={14} /> : <UserPlus size={14} />}
              {isSignUp ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          {/* Error / Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuthSubmit} className="space-y-5">

            {/* Role + Department Row */}
            <div className={`grid grid-cols-1 gap-5 ${isSignUp && needsDept ? "sm:grid-cols-2" : ""}`}>
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
                  <ChevronDown size={16} className={`text-secondary transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                <AnimatePresence>
                  {isRoleDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => { setRoleCode(r.code); setIsRoleDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer ${r.code === roleCode ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-primary hover:bg-surface-secondary"}`}
                        >
                          <r.icon size={15} className={r.code === roleCode ? "text-indigo-500" : "text-secondary"} />
                          <div>
                            <div className="font-semibold">{r.display}</div>
                            <div className="text-[11px] text-secondary">{r.desc}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Department — only shown for HOD/Faculty and during Sign Up */}
              {isSignUp && needsDept && (
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 text-secondary" size={16} />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-primary focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                      required={needsDept}
                    >
                      {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Full Name — Sign Up only */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-secondary" size={16} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Anil Kumar Mahato"
                      className={inputClass}
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Identifier Mode Toggle (Email / Phone) */}
            {isSignUp && (
              <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setIdentifierMode("email")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${identifierMode === "email" ? "bg-indigo-600 text-white shadow" : "text-secondary hover:text-primary"}`}
                >
                  <Mail size={12} /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifierMode("phone")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${identifierMode === "phone" ? "bg-indigo-600 text-white shadow" : "text-secondary hover:text-primary"}`}
                >
                  <Phone size={12} /> Phone
                </button>
              </div>
            )}

            {/* Email or Phone */}
            <div>
              <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                {identifierMode === "email" || !isSignUp ? "Email / Phone Number" : "Phone Number"}
              </label>
              <div className="relative">
                {identifierMode === "email" || !isSignUp
                  ? <Mail className="absolute left-3.5 top-3 text-secondary" size={16} />
                  : <Phone className="absolute left-3.5 top-3 text-secondary" size={16} />
                }
                <input
                  type={identifierMode === "email" || !isSignUp ? "text" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={!isSignUp ? "your@email.ac.in or +91 phone" : identifierMode === "email" ? "you@vignan.ac.in" : "+91 9876543210"}
                  className={inputClass}
                  required
                  autoComplete={isSignUp ? "off" : "username"}
                />
              </div>
            </div>

            {/* Password or OTP */}
            {!isOtpMode ? (
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Password {isSignUp && <span className="text-secondary/60 font-normal normal-case">(min 8 characters)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-secondary" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                    required
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isSignUp && (
                  <div className="flex justify-between items-center mt-2">
                    <button
                      type="button"
                      onClick={() => { setIsOtpMode(true); setOtpSent(false); setOtp(""); setError(""); setSuccess(""); setOtpContext("login"); }}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Login with OTP instead
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(identifier); setForgotStep(1); setNewPassword(""); setForgotOtp(""); setForgotError(""); setShowForgotModal(true); }}
                      className="text-xs font-medium text-secondary hover:text-indigo-600 dark:hover:text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {!otpSent ? (
                  <motion.button
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading || !identifier.trim()}
                    className="w-full py-3 mt-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail size={18} /> {loading ? "Sending..." : "Send OTP"}
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                        Enter 6-digit OTP
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3 text-secondary" size={16} />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="123456"
                          className={inputClass}
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>
                      <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck size={18} /> {loading ? "Verifying..." : otpContext === "signup" ? "Verify OTP & Create Account" : "Verify OTP & Login"}
                    </motion.button>
                  </motion.div>
                )}
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsOtpMode(false); setError(""); setSuccess(""); }}
                    className="text-xs font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Back to Password Login
                  </button>
                </div>
              </AnimatePresence>
            )}

            {/* Confirm Password — Sign Up only */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  key="confirm-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-secondary" size={16} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                      required={isSignUp}
                      autoComplete="new-password"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isOtpMode && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSignUp ? <UserPlus size={18} /> : <ShieldCheck size={18} />}
                {loading
                  ? (isSignUp ? "Creating Account…" : "Verifying Credentials…")
                  : isSignUp
                    ? `Register as ${selectedRole.display}`
                    : "Sign In to Dashboard"
                }
              </motion.button>
            )}

            {!isSignUp && (
              <p className="text-center text-xs text-secondary pt-1">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setIsSignUp(true); setError(""); setSuccess(""); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                  Sign Up
                </button>
              </p>
            )}

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
                <button onClick={() => setShowForgotModal(false)} className="text-secondary hover:text-primary transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {forgotError && (
                  <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm font-medium text-rose-600">
                    {forgotError}
                  </div>
                )}
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
                        OTP sent to <strong>{forgotEmail}</strong>.
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary uppercase mb-2">Security Code</label>
                        <input type="text" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-base font-bold tracking-[0.2em] text-center text-primary focus:border-indigo-500 focus:outline-none shadow-sm" required />
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
