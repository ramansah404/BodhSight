import React, { useEffect, useState } from "react";
import { User, ShieldCheck, Trash2, Edit2, Loader2, AlertTriangle } from "lucide-react";
import { AdminAPI } from "../services/api";

type AdminUser = {
  id: string;
  email: string | null;
  phone_number: string | null;
  full_name: string;
  role: string;
  department: string | null;
  created_at: string;
};

const ROLES = ["Chairman", "Principal", "Dean", "HOD", "Faculty", "IQAC", "Admin"];
const DEPARTMENTS = ["CSE", "ME", "ECE", "EEE", "CE", "IT", "MBA", "MCA"];

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await AdminAPI.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string) => {
    try {
      await AdminAPI.updateUserRole(userId, editRole, editRole === "HOD" || editRole === "Faculty" ? editDept : null);
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to update user: " + (err.response?.data?.detail || ""));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to completely delete this user? This cannot be undone.")) return;
    try {
      await AdminAPI.deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user: " + (err.response?.data?.detail || ""));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
          <ShieldCheck className="text-indigo-600" size={32} />
          User Management
        </h1>
        <p className="text-secondary text-sm mt-2">Manage all registered accounts, assign RBAC roles, and revoke access.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-4 flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Role & Dept</th>
                <th className="p-4 font-bold">Joined</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-primary text-sm">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-secondary">
                    <div>{u.email || "—"}</div>
                    <div className="text-xs">{u.phone_number || ""}</div>
                  </td>
                  <td className="p-4">
                    {editingId === u.id ? (
                      <div className="flex gap-2 items-center">
                        <select 
                          value={editRole} 
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-background border border-border rounded text-sm p-1 text-primary focus:outline-none"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {(editRole === "HOD" || editRole === "Faculty") && (
                          <select 
                            value={editDept} 
                            onChange={(e) => setEditDept(e.target.value)}
                            className="bg-background border border-border rounded text-sm p-1 text-primary focus:outline-none"
                          >
                            <option value="">Dept</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        )}
                        <button onClick={() => handleUpdateRole(u.id)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs bg-slate-500 text-white px-2 py-1 rounded hover:bg-slate-400">Cancel</button>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {u.role}
                        </span>
                        {u.department && (
                          <span className="ml-2 text-xs text-secondary">{u.department}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-secondary">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => { setEditingId(u.id); setEditRole(u.role); setEditDept(u.department || "CSE"); }}
                      className="p-1.5 text-secondary hover:text-indigo-600 transition-colors bg-surface-secondary rounded-lg"
                      title="Edit Role"
                    >
                      <Edit2 size={16} />
                    </button>
                    {u.role !== "Admin" && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-secondary hover:text-rose-600 transition-colors bg-surface-secondary rounded-lg"
                        title="Revoke Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
