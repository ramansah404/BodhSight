import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "./contexts/ThemeContext";
import { RoleProvider } from "./contexts/RoleContext";

import Layout from "./components/layout/Layout";

import ProtectedRoute from "./components/layout/ProtectedRoute";




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
import StudentDashboard from "./pages/StudentDashboard";
import Messages      from "./pages/Messages";
import ManageMarks   from "./pages/ManageMarks";



export default function App() {

  return (

    <ThemeProvider>
    <RoleProvider>
    <HashRouter>

      <Routes>

        {/* Public routes ΓÇö accessible without login */}

        <Route path="/"      element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />



        {/* All dashboard routes ΓÇö require an active session */}

        {/* ProtectedRoute with no allowedRoles = session check only */}

        <Route element={<ProtectedRoute />}>

          <Route element={<Layout />}>



            {/* Accessible to all logged-in roles EXCEPT Admin (Admin dashboard is separate) */}
            <Route element={<ProtectedRoute requiredPermission="view_overview" />}>
              <Route path="dashboard"       element={<Dashboard />} />
            </Route>

            {/* Student & Parent specific portal */}
            <Route element={<ProtectedRoute requiredPermission="canViewStudentDashboard" />}>
              <Route path="student-dashboard" element={<StudentDashboard />} />
            </Route>

            {/* Settings & Messages */}
            <Route element={<ProtectedRoute />}>
              <Route path="settings"        element={<Settings />} />
              <Route path="messages"        element={<Messages />} />
            </Route>

            {/* Courses ΓÇö all roles can view */}
            <Route element={<ProtectedRoute requiredPermission="view_courses" />}>
              <Route path="courses"         element={<Courses />} />
            </Route>

            {/* Anomalies & Recommendations ΓÇö RBAC filtered */}
            <Route element={<ProtectedRoute requiredPermission="manage_exceptions" />}>
              <Route path="anomalies"       element={<Problems />} />
              <Route path="exceptions"      element={<Exceptions />} />
              <Route path="recommendations" element={<Recommendations />} />
            </Route>

            {/* Trends ΓÇö requires view_trends */}
            <Route element={<ProtectedRoute requiredPermission="view_trends" />}>
              <Route path="trends"        element={<Trends />} />
            </Route>

            {/* Departments ΓÇö requires view_departments */}
            <Route element={<ProtectedRoute requiredPermission="view_departments" />}>
              <Route path="departments"   element={<Departments />} />
            </Route>

            {/* Batches ΓÇö general access but still wrapped for authenticated sessions */}
            <Route element={<ProtectedRoute />}>
              <Route path="batches"       element={<Batches />} />
            </Route>

            {/* Sections & Students ΓÇö general access */}
            <Route element={<ProtectedRoute requiredPermission="view_sections" />}>
              <Route path="sections"      element={<Sections />} />
            </Route>
            <Route element={<ProtectedRoute requiredPermission="view_students" />}>
              <Route path="students"      element={<Students />} />
            </Route>

            {/* Marks Management — Faculty, HOD, Admin */}
            <Route element={<ProtectedRoute allowedRoles={["Faculty", "HOD", "Admin"]} />}>
              <Route path="manage-marks"  element={<ManageMarks />} />
            </Route>

            {/* Data Hub — Requires view_data_hub */}
            <Route element={<ProtectedRoute requiredPermission="view_data_hub" />}>
              <Route path="data-hub"      element={<DataHub />} />
              <Route path="data-hub/manual-entry" element={<ManualEntry />} />
            </Route>

            {/* Admin User Management — Admin only (still uses allowedRoles) */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="admin/users"   element={<AdminDashboard />} />
            </Route>

            {/* Reports ΓÇö requires view_reports */}
            <Route element={<ProtectedRoute requiredPermission="view_reports" />}>
              <Route path="reports"       element={<Reports />} />
            </Route>
          </Route>

        </Route>



        {/* Catch-all: redirect to login */}

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>

    </HashRouter>
    </RoleProvider>
    </ThemeProvider>

  );

}

