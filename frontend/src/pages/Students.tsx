export default function Students() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-rose-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">At-Risk Student Cohort Management</h1>
        <p className="text-rose-100 text-sm mt-1">Identifying persistent underperformance and deploying targeted support.</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Identified Risk Groups</h3>
        <p className="text-sm text-gray-600">27 students flagged for persistent underperformance in core backlogs. Recommended support: Peer tutoring.</p>
      </div>
    </div>
  );
}
