import { Users } from 'lucide-react';

export default function Batches() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 text-primary shadow-sm">
        <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-500/20 mb-2">
          <Users size={14} /> Cohort Progression
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Batch Progression Intelligence</h1>
        <p className="text-secondary text-sm mt-1">
          Tracking long-term cohort outcomes and transition rates to ensure institutional graduation goals.
        </p>
      </div>
      <div className="bg-surface rounded-3xl border border-border/60 p-6 shadow-sm">
        <h3 className="font-bold text-primary text-lg mb-4">Cohort Batch 2024-2028</h3>
        <p className="text-sm text-secondary">Average CGPA: 7.9 • Backlog Percentage: 12.5% • Risk Level: Moderate</p>
      </div>
    </div>
  );
}
