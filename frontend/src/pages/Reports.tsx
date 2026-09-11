import { useState } from "react";
import { FileText, Download, CheckCircle2, ShieldCheck, Printer, Lock } from "lucide-react";
import { getRolePermissions } from "../utils/rbac";
import type { ReportItem } from "../types/agent10";

export default function Reports() {
  const rawRole = localStorage.getItem("bodhsight_display_role") || localStorage.getItem("bodhsight_role") || "Dean";
  const permissions = getRolePermissions(rawRole);

  const [reports] = useState<ReportItem[]>([
    { id: "rep-01", title: "Principal & Management Executive Academic Summary", type: "PDF", generated_date: "2026-09-11", category: "Management", size: "2.4 MB" },
    { id: "rep-02", title: "IQAC Accreditation Compliance & Ingestion Audit", type: "PDF", generated_date: "2026-09-10", category: "Quality Assurance", size: "3.1 MB" },
    { id: "rep-03", title: "Agent 10 Exception & Statistical Deviation Log", type: "CSV", generated_date: "2026-09-10", category: "Exceptions", size: "840 KB" },
    { id: "rep-04", title: "Department-wise Course Priority & Intervention Plan", type: "PDF", generated_date: "2026-09-09", category: "Interventions", size: "1.9 MB" }
  ]);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleDownload = (id: string) => {
    if (!permissions.canExportOfficialReports) {
      alert("Access Denied: Official report export is restricted to Principal, Management, IQAC, and Deans.");
      return;
    }
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 3000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#0B1120]/10 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold border border-white/15">
            <FileText size={14} /> Executive Reporting Suite ({rawRole} View)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Academic Performance Reports</h1>
          <p className="text-slate-300 text-sm">
            {permissions.canExportOfficialReports 
              ? "Generate, export, and review consolidated institutional reports for management and accreditation bodies."
              : "Your current role is restricted from exporting institutional master reports."}
          </p>
        </div>
        <div className="bg-[#0B1120]/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-right">
          <div className="text-xs text-indigo-200 font-semibold uppercase">Compliance Status</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5 flex items-center gap-1.5 justify-end">
            <ShieldCheck size={18} /> 100% Verified
          </div>
        </div>
      </div>

      <div className="bg-[#0B1120] rounded-3xl border border-slate-800/60 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Printer className="text-indigo-400" size={20} /> Available Institutional Exports
          </h2>
          <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full">
            {permissions.canExportOfficialReports ? "Export Authorized" : "Restricted Access"}
          </span>
        </div>

        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-slate-900/40 rounded-2xl p-5 border border-slate-800/60/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-800 text-xs font-extrabold rounded-md uppercase">
                    {rep.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{rep.category} • {rep.size}</span>
                </div>
                <h3 className="font-bold text-white text-base">{rep.title}</h3>
                <p className="text-xs text-slate-400">Generated with complete Agent 10 telemetry lineage.</p>
              </div>

              <div className="flex items-center gap-3">
                {successId === rep.id ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 size={16} /> Downloaded Successfully
                  </span>
                ) : permissions.canExportOfficialReports ? (
                  <button 
                    onClick={() => handleDownload(rep.id)}
                    disabled={downloadingId === rep.id}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap cursor-pointer"
                  >
                    <Download size={16} /> {downloadingId === rep.id ? "Rendering PDF..." : `Export ${rep.type}`}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-800/60">
                    <Lock size={14} /> Restricted Role
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
