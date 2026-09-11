export default function Sections() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Section-Level Disparity Telemetry</h1>
        <p className="text-blue-100 text-sm mt-1">Comparing section performance across identical course offerings.</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Active Section Matrix</h3>
        <p className="text-sm text-gray-600">All sections operating within normal Z-score variance parameters, except CS301 Sec-B.</p>
      </div>
    </div>
  );
}
