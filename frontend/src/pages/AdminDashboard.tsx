import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, Edit2, Loader2, AlertTriangle, Plus, Key, Power, X, Users, Lock } from "lucide-react";
import { AdminAPI } from "../services/api";

type AdminUser = {
  id: string;
  email: string | null;
  phone_number: string | null;
  full_name: string;
  role: string;
  department: string | null;
  created_at: string;
  is_active: boolean;
};

const ROLES = ["Chairman", "Principal", "Dean", "HOD", "Faculty", "IQAC", "Admin"];
const DEPARTMENTS = ["CSE", "ME", "ECE", "EEE", "CE", "IT", "MBA", "MCA"];

const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "rbac">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editDept, setEditDept] = useState("");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", role: "Faculty", department: "CSE" });
  
  // Reset Password Modal State
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

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
    let cancelled = false;
    
    const loadData = async () => {
      try {
        const data = await AdminAPI.getAllUsers();
        if (!cancelled) setUsers(data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.detail || "Failed to fetch users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await AdminAPI.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to update status: " + (err.response?.data?.detail || ""));
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminAPI.createUser({
        ...newUser,
        department: newUser.role === "HOD" || newUser.role === "Faculty" ? newUser.department : null
      });
      setIsCreateOpen(false);
      setNewUser({ full_name: "", email: "", password: "", role: "Faculty", department: "CSE" });
      fetchUsers();
    } catch (err: any) {
      alert("Failed to create user: " + (err.response?.data?.detail || ""));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetId || !newPassword) return;
    try {
      await AdminAPI.resetPassword(resetId, newPassword);
      setResetId(null);
      setNewPassword("");
      alert("Password reset successfully!");
    } catch (err: any) {
      alert("Failed to reset password: " + (err.response?.data?.detail || ""));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="bg-surface/80 backdrop-blur-sm border border-border/60 rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} />
            User Management
          </h1>
          <p className="text-secondary text-sm mt-2">Manage all registered accounts, assign roles, and review RBAC matrices.</p>
        </div>
        {activeTab === "users" && (
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Plus size={18} />
            Create User
          </button>
        )}
      </div>

      <div className="flex space-x-2 border-b border-border/60 pb-px">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "users" ? "border-indigo-600 text-indigo-600" : "border-transparent text-secondary hover:text-primary"
          }`}
        >
          <Users size={16} /> User Management
        </button>
        <button
          onClick={() => setActiveTab("rbac")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "rbac" ? "border-indigo-600 text-indigo-600" : "border-transparent text-secondary hover:text-primary"
          }`}
        >
          <Lock size={16} /> RBAC Matrix
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-4 flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {activeTab === "users" ? (
        <div className="bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Role & Dept</th>
                <th className="p-4 font-bold">Status</th>
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
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button 
                      onClick={() => { setEditingId(u.id); setEditRole(u.role); setEditDept(u.department || "CSE"); }}
                      className="p-1.5 text-secondary hover:text-indigo-600 transition-colors bg-surface-secondary rounded-lg"
                      title="Edit Role"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => { setResetId(u.id); setNewPassword(generatePassword()); }}
                      className="p-1.5 text-secondary hover:text-amber-600 transition-colors bg-surface-secondary rounded-lg"
                      title="Reset Password"
                    >
                      <Key size={16} />
                    </button>
                    {u.role !== "Admin" && (
                      <>
                        <button 
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`p-1.5 transition-colors bg-surface-secondary rounded-lg ${u.is_active ? 'text-secondary hover:text-orange-600' : 'text-orange-500 hover:text-orange-400'}`}
                          title={u.is_active ? "Suspend User" : "Reactivate User"}
                        >
                          <Power size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-secondary hover:text-rose-600 transition-colors bg-surface-secondary rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
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
      ) : (
        <div className="bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border/60">
            <h2 className="text-lg font-bold text-primary">Role-Based Access Control (RBAC) Permissions</h2>
            <p className="text-sm text-secondary mt-1">
              Below is the strictly enforced permission matrix for the BodhSight platform. As Admin, you assign these roles via the User Management tab to strictly control access.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-secondary text-secondary text-xs uppercase tracking-wider border-b border-border/60">
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Scope</th>
                  <th className="p-4 font-bold">Permitted Pages</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Chairman</span></td>
                  <td className="p-4 text-secondary">Institution-wide (Macro)</td>
                  <td className="p-4 text-secondary">Overview, Trends, Courses, Depts, Sections, Students, Reports</td>
                  <td className="p-4 text-secondary">View all institution data, executive reporting</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Principal</span></td>
                  <td className="p-4 text-secondary">Institution-wide</td>
                  <td className="p-4 text-secondary">Overview, Trends, Courses, Depts, Sections, Students, Reports</td>
                  <td className="p-4 text-secondary">View all institution data, academic reporting</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Dean</span></td>
                  <td className="p-4 text-secondary">Institution-wide</td>
                  <td className="p-4 text-secondary">Overview, Trends, Courses, Depts, Sections, Students, Reports</td>
                  <td className="p-4 text-secondary">Monitor college health, exceptions, trust audits</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">HOD</span></td>
                  <td className="p-4 text-secondary">Department-Specific</td>
                  <td className="p-4 text-secondary">Overview, Trends, Courses, Sections, Students, Data Hub</td>
                  <td className="p-4 text-secondary">View department anomalies, manage manual entries</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Faculty</span></td>
                  <td className="p-4 text-secondary">Course-Specific</td>
                  <td className="p-4 text-secondary">Overview, Courses, Sections, Students, Data Hub</td>
                  <td className="p-4 text-secondary">View assigned course telemetry, student support</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">IQAC</span></td>
                  <td className="p-4 text-secondary">Institution-wide Quality</td>
                  <td className="p-4 text-secondary">Overview, Trends, Courses, Depts, Reports</td>
                  <td className="p-4 text-secondary">Monitor quality metrics, reporting</td>
                </tr>
                <tr className="hover:bg-surface-secondary/50">
                  <td className="p-4 font-semibold text-primary"><span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Admin</span></td>
                  <td className="p-4 text-secondary">System-wide Settings</td>
                  <td className="p-4 text-secondary">Admin Dashboard (User Management, RBAC)</td>
                  <td className="p-4 text-secondary">Create/Suspend Users, Assign Roles, Reset Passwords</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 text-secondary hover:text-primary"><X size={20}/></button>
            <h2 className="text-xl font-bold text-primary mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-secondary mb-1">Full Name</label>
                <input required type="text" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-primary focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-primary focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-secondary mb-1">Password</label>
                <div className="flex gap-2">
                  <input required type="text" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="flex-1 bg-background border border-border rounded-lg p-2 text-primary focus:border-indigo-500 outline-none" placeholder="Temporary Password" />
                  <button type="button" onClick={() => setNewUser({...newUser, password: generatePassword()})} className="px-3 py-2 bg-surface-secondary text-secondary rounded-lg border border-border hover:text-indigo-600 transition-colors text-sm font-medium whitespace-nowrap">
                    Auto-gen
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-secondary mb-1">Role</label>
                  <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-primary outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {(newUser.role === "HOD" || newUser.role === "Faculty") && (
                  <div className="flex-1">
                    <label className="block text-sm text-secondary mb-1">Department</label>
                    <select value={newUser.department} onChange={e=>setNewUser({...newUser, department: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 text-primary outline-none">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors mt-4">Create Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setResetId(null)} className="absolute top-4 right-4 text-secondary hover:text-primary"><X size={20}/></button>
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><Key className="text-amber-500" size={20}/> Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm text-secondary mb-1">New Password</label>
                <input required type="text" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 text-primary focus:border-amber-500 outline-none" placeholder="Type new password" />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-white font-semibold py-2 rounded-lg hover:bg-amber-600 transition-colors">Confirm Reset</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
