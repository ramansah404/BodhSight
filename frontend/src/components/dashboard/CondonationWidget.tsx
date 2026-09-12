import { useEffect, useState } from "react";
import { AlertCircle, IndianRupee, TrendingDown } from "lucide-react";
import { Agent10API } from "../../services/api";
import { useFilters } from "../../contexts/FilterContext";
import type { CondonationForecastMetrics } from "../../types/agent10";
import StudentDrilldownModal from "../ui/StudentDrilldownModal";

export default function CondonationWidget() {
  const { filters } = useFilters();
  const [metrics, setMetrics] = useState<CondonationForecastMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    Agent10API.getCondonationForecast(filters)
      .then(res => {
        if (!cancelled) {
          setMetrics(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters]);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col h-full bg-surface hover:bg-surface/80 transition-colors border border-border/60 rounded-3xl shadow-sm relative overflow-hidden cursor-pointer group"
      >
      {/* Background Gradient matching the theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="p-5 flex-1 flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
            <AlertCircle className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            Condonation Zone (65-75%)
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
            Forecast
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col justify-center animate-pulse gap-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        ) : metrics ? (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {metrics.requiring_condonation}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  / {metrics.at_risk_students} Students
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Requiring condonation fee payment
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <IndianRupee className="w-3.5 h-3.5" /> Expected Revenue
                </div>
                <div className="text-sm font-semibold text-foreground">
                  ₹{metrics.expected_revenue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Est. Pass Rate
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {metrics.academic_impact.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Failed to load data
          </div>
        )}
      </div>
    </div>
    
    <StudentDrilldownModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      context="condonation"
      title="Condonation Zone Students"
    />
  </>
  );
}
