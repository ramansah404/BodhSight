import { useEffect, useState } from "react";
import { Sparkles, Calendar, AlertTriangle, X, BarChart3, Target } from "lucide-react";
import { Agent10API } from "../../services/api";
import type { WeeklyBriefing } from "../../types/agent10";
import { useFilters } from "../../contexts/FilterContext";

interface WeeklyBriefingWidgetProps {
  currentRole: string;
}

export default function WeeklyBriefingWidget({ currentRole }: WeeklyBriefingWidgetProps) {
  const { filters } = useFilters();
  const [briefing, setBriefing] = useState<WeeklyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Only run for aggregate roles (not Faculty)
  const isAggregate = currentRole !== "Faculty";

  useEffect(() => {
    if (!isAggregate || dismissed) return;

    let cancelled = false;
    setLoading(true);

    Agent10API.getWeeklyBriefing(filters)
      .then((data) => {
        if (!cancelled) {
          setBriefing(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load weekly briefing:", err);
          setError("Briefing unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters, isAggregate, dismissed]);

  if (!isAggregate || dismissed || (!loading && !briefing && !error)) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-indigo-900/10 dark:bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/20 animate-pulse">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-indigo-500/20 rounded w-1/4" />
            <div className="h-4 bg-indigo-500/10 rounded w-3/4" />
            <div className="h-4 bg-indigo-500/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return null; // Don't show anything if it fails to avoid clutter
  }

  return (
    <div className="relative bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-3xl p-6 border border-indigo-500/20 shadow-lg overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
      
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-2 text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        aria-label="Dismiss Briefing"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
            <Calendar size={28} />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight text-primary">Monday Morning Briefing</h2>
              {briefing.llm_used && (
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  <Sparkles size={10} />
                  AI Synthesized
                </div>
              )}
            </div>
            <p className="text-xs text-secondary font-medium">
              Prepared for {briefing.role} | Scope: {briefing.scope}
            </p>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            {briefing.summary_narrative.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-sm text-primary/90 leading-relaxed font-medium">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-indigo-500/10">
            <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-secondary uppercase tracking-wider">
                <BarChart3 size={14} className="text-emerald-500" />
                Key Metric
              </div>
              <div className="text-2xl font-black tracking-tight">
                {briefing.overall_snapshot.pass_rate}%
              </div>
              <div className="text-xs text-secondary mt-1">Institutional Pass Rate</div>
            </div>

            <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-secondary uppercase tracking-wider">
                <AlertTriangle size={14} className="text-rose-500" />
                Active Risks
              </div>
              <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                {briefing.overall_snapshot.active_anomalies || briefing.top_risks.length}
              </div>
              <div className="text-xs text-secondary mt-1">Requiring Review</div>
            </div>

            <div className="bg-white/40 dark:bg-black/20 rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-secondary uppercase tracking-wider">
                <Target size={14} className="text-amber-500" />
                Top Priority
              </div>
              <div className="font-bold text-sm truncate">
                {briefing.areas_requiring_attention[0]?.course_code || "None"}
              </div>
              <div className="text-xs text-secondary mt-1 truncate">
                {briefing.areas_requiring_attention[0]?.recommended_intervention || "All stable"}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
