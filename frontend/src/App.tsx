import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";


import Landing       from "./pages/Landing";
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Trends        from "./pages/Trends";
import Courses       from "./pages/Courses";
import Departments   from "./pages/Departments";
import Sections      from "./pages/Sections";
import Batches       from "./pages/Batches";
import Students      from "./pages/Students";
import Problems      from "./pages/Problems";
import Recommendations from "./pages/Recommendations";
import Reports       from "./pages/Reports";
import Settings      from "./pages/Settings";
import DataHub       from "./pages/DataHub";
import ManualEntry   from "./pages/ManualEntry";
import Exceptions    from "./pages/Exceptions";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <ThemeProvider>
    <HashRouter>
      <Routes>
        {/* Public routes — accessible without login */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* All dashboard routes — require an active session */}
        {/* ProtectedRoute with no allowedRoles = session check only */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Accessible to all logged-in roles */}
            <Route path="dashboard"       element={<Dashboard />} />
            <Route path="settings"        element={<Settings />} />

            {/* Courses — all roles can view */}
            <Route path="courses"         element={<Courses />} />

            {/* Anomalies & Recommendations — all roles, but data is RBAC-filtered on backend */}
            <Route path="anomalies"       element={<Problems />} />
            <Route path="exceptions"      element={<Exceptions />} />
            <Route path="recommendations" element={<Recommendations />} />

            {/* Trends — senior roles only */}
            <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
              <Route path="trends"        element={<Trends />} />
            </Route>

            {/* Departments — top management only */}
            <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean"]} />}>
              <Route path="departments"   element={<Departments />} />
            </Route>

            {/* Batches — not Faculty */}
            <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
              <Route path="batches"       element={<Batches />} />
            </Route>

            {/* Sections & Students — not top-level Chairman/Principal only */}
            <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "Dean", "HOD", "Faculty"]} />}>
              <Route path="sections"      element={<Sections />} />
              <Route path="students"      element={<Students />} />
            </Route>

            {/* Data Hub — Data upload for faculty/HOD */}
            <Route element={<ProtectedRoute allowedRoles={["HOD", "Faculty", "Chairman"]} />}>
              <Route path="data-hub"      element={<DataHub />} />
              <Route path="data-hub/manual-entry" element={<ManualEntry />} />
            </Route>

            {/* Admin User Management — Admin only */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="admin/users"   element={<AdminDashboard />} />
            </Route>

            {/* Reports — senior management */}
            <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
              <Route path="reports"       element={<Reports />} />
            </Route>

          </Route>
        </Route>

        {/* Catch-all: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
    </ThemeProvider>
  );
}
