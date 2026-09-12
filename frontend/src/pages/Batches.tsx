export default function Batches() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-teal-950 via-indigo-900 to-surface rounded-3xl p-8 text-primary shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Batch Progression Intelligence</h1>
        <p className="text-teal-100 text-sm mt-1">Tracking cohort trajectories from admission to graduation.</p>
      </div>
      <div className="bg-surface rounded-3xl border border-border/60 p-6 shadow-sm">
        <h3 className="font-bold text-primary text-lg mb-4">Cohort Batch 2024-2028</h3>
        <p className="text-sm text-secondary">Average CGPA: 7.9 • Backlog Percentage: 12.5% • Risk Level: Moderate</p>
      </div>
    </div>
  );
}
