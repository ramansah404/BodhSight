export default function Settings() {
  const role = localStorage.getItem("bodhsight_role") || "Dean";
  const name = localStorage.getItem("bodhsight_name") || "User";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings & RBAC Profile</h1>
        <p className="text-slate-300 text-sm mt-1">Manage session preferences and security guardrails.</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Active Session Details</h3>
        <div className="text-sm space-y-2 text-gray-700">
          <div><strong className="text-gray-900">Authenticated User:</strong> {name}</div>
          <div><strong className="text-gray-900">Role Scope:</strong> {role}</div>
          <div><strong className="text-gray-900">Backend Connection:</strong> http://localhost:8000/api/v1 (Active with Fallback)</div>
        </div>
      </div>
    </div>
  );
}
