import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "./contexts/ThemeContext";
import { RoleProvider } from "./contexts/RoleContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trends = lazy(() => import("./pages/Trends"));
const Courses = lazy(() => import("./pages/Courses"));
const Departments = lazy(() => import("./pages/Departments"));
const Sections = lazy(() => import("./pages/Sections"));
const Batches = lazy(() => import("./pages/Batches"));
const Students = lazy(() => import("./pages/Students"));
const Problems = lazy(() => import("./pages/Problems"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const DataHub = lazy(() => import("./pages/DataHub"));
const ManualEntry = lazy(() => import("./pages/ManualEntry"));
const Exceptions = lazy(() => import("./pages/Exceptions"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const ManageMarks = lazy(() => import("./pages/ManageMarks"));

// Loading spinner for lazy routes
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-secondary font-medium">Loading modules...</div>
      </div>
    </div>
  );
}

export default function App() {

  return (

    <ThemeProvider>
    <RoleProvider>
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public routes — accessible without login */}

          <Route path="/"      element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />



          {/* All dashboard routes — require an active session */}

          {/* ProtectedRoute with no allowedRoles = session check only */}

          <Route element={<ProtectedRoute />}>

            <Route element={<Layout />}>



              {/* Accessible to all logged-in roles EXCEPT Admin (Admin dashboard is separate) */}
              <Route element={<ProtectedRoute requiredPermission="view_overview" />}>
                <Route path="dashboard"       element={<Dashboard />} />
              </Route>

              {/* Student & Parent specific portal */}
              <Route element={<ProtectedRoute requiredPermission="view_overview" />}>
                <Route path="student-dashboard" element={<StudentDashboard />} />
              </Route>

              {/* Settings & Messages */}
              <Route element={<ProtectedRoute />}>
                <Route path="settings"        element={<Settings />} />
                <Route path="messages"        element={<Messages />} />
              </Route>

              {/* Courses — all roles can view */}
              <Route element={<ProtectedRoute requiredPermission="view_courses" />}>
                <Route path="courses"         element={<Courses />} />
              </Route>

              {/* Anomalies & Recommendations — RBAC filtered */}
              <Route element={<ProtectedRoute requiredPermission="manage_exceptions" />}>
                <Route path="anomalies"       element={<Problems />} />
                <Route path="exceptions"      element={<Exceptions />} />
                <Route path="recommendations" element={<Recommendations />} />
              </Route>

              {/* Trends — requires view_trends */}
              <Route element={<ProtectedRoute requiredPermission="view_trends" />}>
                <Route path="trends"        element={<Trends />} />
              </Route>

              {/* Departments — requires view_departments */}
              <Route element={<ProtectedRoute requiredPermission="view_departments" />}>
                <Route path="departments"   element={<Departments />} />
              </Route>

              {/* Batches — general access but still wrapped for authenticated sessions */}
              <Route element={<ProtectedRoute />}>
                <Route path="batches"       element={<Batches />} />
              </Route>

              {/* Sections & Students — general access */}
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

              {/* Reports — requires view_reports */}
              <Route element={<ProtectedRoute requiredPermission="view_reports" />}>
                <Route path="reports"       element={<Reports />} />
              </Route>
            </Route>

          </Route>



          {/* Catch-all: redirect to login */}

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Suspense>
    </HashRouter>
    </RoleProvider>
    </ThemeProvider>

  );

}

