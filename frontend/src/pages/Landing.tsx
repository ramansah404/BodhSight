import BrandLogo from "../components/ui/BrandLogo";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { 
  Sparkles, ShieldCheck, Activity, BrainCircuit, LineChart, 
  ChevronRight, MoveRight, Database, Lock, Search, Users,
  Menu, X
} from "lucide-react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="public-page min-h-screen overflow-x-hidden bg-background text-primary font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* ---------------- NAVBAR ---------------- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-2xl border-border/80 py-3 shadow-2xl shadow-indigo-500/5" 
          : "bg-background/20 backdrop-blur-sm border-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <BrandLogo />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium hover:text-primary transition-colors">Platform</button>
            <button onClick={() => scrollTo('intelligence')} className="text-sm font-medium hover:text-primary transition-colors">Intelligence</button>
            <button onClick={() => scrollTo('security')} className="text-sm font-medium hover:text-primary transition-colors">Security</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle showLabel />
            <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-primary transition-colors">Sign In</button>
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-full text-sm font-bold transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-indigo-600/25"
            >
              Enter BodhSight
            </button>
          </div>

          {/* Mobile Nav Toggle */}
          <button className="md:hidden text-primary" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <BrandLogo />
              <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-6 text-lg">
              <ThemeToggle showLabel />
              <button onClick={() => scrollTo('features')} className="text-left font-medium">Platform</button>
              <button onClick={() => scrollTo('intelligence')} className="text-left font-medium">Intelligence</button>
              <button onClick={() => scrollTo('security')} className="text-left font-medium">Security</button>
              <hr className="border-border my-2" />
              <button onClick={() => navigate('/login')} className="text-left font-medium">Sign In</button>
              <button onClick={() => navigate('/login')} className="bg-indigo-600 text-primary text-center py-3 rounded-xl font-bold">Enter BodhSight</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- HERO ---------------- */}
      <div className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-indigo-500/20 via-cyan-400/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
        
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-indigo-500/10 backdrop-blur-xl text-cyan-300 text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/10"
          >
            <Sparkles size={14} /> Agent 10 is Live
          </motion.div>
          
          <motion.h1 
            initial="hidden" animate="visible" variants={fadeIn}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-primary tracking-tight leading-[1.05]"
          >
            Academic Intelligence,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Built for Better Decisions.</span>
          </motion.h1>
          
          <motion.p 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-secondary max-w-2xl mx-auto font-medium"
          >
            BodhSight transforms raw institutional data into actionable intelligence. 
            Detect anomalies, track performance trends, and deploy interventions before students fall behind.
          </motion.p>
          
          <motion.div 
            initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all duration-300 hover:scale-[1.03] shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              Enter Dashboard <MoveRight size={16} />
            </button>
            <button 
              onClick={() => scrollTo('features')}
              className="w-full sm:w-auto px-8 py-3.5 bg-surface/60 hover:bg-surface-secondary border border-border hover:border-indigo-500/40 text-primary rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2"
            >
              Explore BodhSight
            </button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="relative z-20 mt-20 max-w-6xl w-full px-6"
        >
          <div className="rounded-[2rem] border border-border/80 bg-surface/60 backdrop-blur-2xl p-2 shadow-2xl shadow-indigo-950/20 overflow-hidden ring-1 ring-white/10">
            <div className="rounded-xl overflow-hidden border border-border relative bg-surface">
              {/* Fake Dashboard Header */}
              <div className="h-12 border-b border-border flex items-center px-4 gap-2 bg-surface/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
                <div className="ml-4 w-64 h-6 rounded-md bg-surface-secondary" />
              </div>
              {/* Fake Dashboard Content */}
              <div className="p-6 grid grid-cols-4 gap-4 opacity-70">
                <div className="col-span-1 space-y-4 hidden md:block">
                  <div className="h-8 rounded bg-indigo-500/20 w-full" />
                  <div className="h-8 rounded bg-surface-secondary w-5/6" />
                  <div className="h-8 rounded bg-surface-secondary w-4/6" />
                </div>
                <div className="col-span-4 md:col-span-3 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 rounded-xl bg-surface-secondary border border-border/50" />
                    <div className="h-24 rounded-xl bg-surface-secondary border border-border/50" />
                    <div className="h-24 rounded-xl bg-indigo-900/40 border border-indigo-500/20" />
                  </div>
                  <div className="h-64 rounded-xl bg-surface-secondary/50 border border-border/50" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---------------- FEATURES ---------------- */}
      <section id="features" className="py-24 relative z-10 border-t border-border/70 bg-background/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">A complete view of your institution.</h2>
            <p className="text-secondary">BodhSight connects the dots between isolated database silos, bringing clarity to assessment patterns, faculty distribution, and student risk.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: <Activity />, title: "Performance", desc: "Real-time insights into pass rates, GPAs, and assessment marks across all departments." },
              { icon: <BrainCircuit />, title: "Anomaly Detection", desc: "Agent 10 continuously scans PostgreSQL views to flag statistical deviations automatically." },
              { icon: <Search />, title: "Student Risk Detection", desc: "Identify at-risk cohorts with high backlogs before they fail out of the program." },
              { icon: <LineChart />, title: "Trend Analysis", desc: "Compare historical term data against the current institutional mean baseline." },
              { icon: <ShieldCheck />, title: "Role-Based Access", desc: "Deans, HODs, and Faculty see precisely what they are authorized to see, securely." },
              { icon: <Database />, title: "PostgreSQL Native", desc: "Direct integration with institutional database views ensures data is always live and trusted." }
            ].map((feature, i) => (
              <motion.div 
                key={i} variants={fadeIn}
                className="bg-surface/70 backdrop-blur-xl border border-border/70 p-7 rounded-[2rem] hover:bg-surface-secondary/60 hover:border-indigo-500/40 transition-all duration-500 group shadow-xl shadow-slate-950/5"
              >
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="intelligence" className="py-24 relative z-10 border-t border-border/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-xs font-bold border border-violet-500/20">
                Workflow
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary">How Agent 10 Works</h2>
              <p className="text-secondary text-lg">BodhSight doesn't just show charts. It actively hunts for problems.</p>
              
              <div className="space-y-8 pt-4">
                {[
                  { num: "01", title: "Data Ingestion", desc: "Reads directly from secure PostgreSQL views containing assessment, attendance, and faculty records." },
                  { num: "02", title: "Statistical Analysis", desc: "Calculates Z-scores and deviations to establish normal institutional baselines." },
                  { num: "03", title: "Intelligence Synthesis", desc: "Flags critical anomalies like unexpected grading variances or section-level disparities." },
                  { num: "04", title: "Actionable Recommendations", desc: "Generates explicit intervention protocols for Deans and HODs to authorize." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-indigo-500 font-mono font-bold text-sm pt-1">{step.num}</div>
                    <div>
                      <h4 className="text-primary font-bold mb-1">{step.title}</h4>
                      <p className="text-sm text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-violet-600/20 blur-[100px] rounded-full" />
              <div className="relative bg-surface/80 backdrop-blur-2xl border border-border rounded-[2rem] p-6 shadow-2xl shadow-indigo-950/20">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <BrainCircuit className="text-violet-400" />
                  <span className="font-bold text-primary">Agent 10 Detection Log</span>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 bg-background rounded-lg text-secondary">
                    <span className="text-emerald-600 dark:text-emerald-400">SUCCESS</span> Connected to people.v_student_profile
                  </div>
                  <div className="p-3 bg-background rounded-lg text-secondary">
                    <span className="text-indigo-600 dark:text-indigo-400">ANALYZING</span> Course performance deviation matrix...
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300">
                    <span className="font-bold">CRITICAL FLAG</span> CS301 Sec-B pass rate (61.2%) dropped &gt; 2σ below mean.
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300">
                    <span className="font-bold">GENERATING</span> Intervention recommendation ID-802...
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- SECURITY / RBAC ---------------- */}
      <section id="security" className="py-24 relative z-10 border-y border-border/70 bg-surface/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Enterprise-Grade Governance</h2>
          <p className="text-secondary max-w-2xl mx-auto mb-12">
            BodhSight respects institutional hierarchy. Information access and action authority are strictly gated by the user's role.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { role: "Dean / Principal", access: "Full Macro View & Audit", icon: <ShieldCheck /> },
              { role: "HOD", access: "Departmental Command", icon: <Users /> },
              { role: "IQAC Officer", access: "Quality Reports", icon: <LineChart /> },
              { role: "Faculty", access: "Assigned Courses Only", icon: <Search /> }
            ].map((item, i) => (
              <div key={i} className="bg-background/60 backdrop-blur-xl border border-border p-6 rounded-[1.5rem] text-left hover:border-emerald-500/40 transition-colors">
                <div className="text-emerald-600 dark:text-emerald-400 mb-3">{item.icon}</div>
                <div className="font-bold text-primary mb-1">{item.role}</div>
                <div className="text-xs text-secondary">{item.access}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">Turn Academic Data Into<br/>Institutional Intelligence.</h2>
          <p className="text-secondary text-lg">Stop guessing. Start acting.</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 mx-auto"
          >
            Sign In to BodhSight <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="py-10 border-t border-border/70 bg-background text-center">
        <div className="flex justify-center mb-4 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
          <BrandLogo />
        </div>
        <p className="text-xs text-secondary font-medium">
          © {new Date().getFullYear()} BodhSight Academic Intelligence Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
