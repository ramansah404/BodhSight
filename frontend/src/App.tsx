import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { lazy, Suspense } from "react";
import LoadingFallback from "./components/ui/LoadingFallback";

const Landing       = lazy(() => import("./pages/Landing"));
const Login         = lazy(() => import("./pages/Login"));
const Dashboard     = lazy(() => import("./pages/Dashboard"));
const Trends        = lazy(() => import("./pages/Trends"));
const Courses       = lazy(() => import("./pages/Courses"));
const Departments   = lazy(() => import("./pages/Departments"));
const Sections      = lazy(() => import("./pages/Sections"));
const Batches       = lazy(() => import("./pages/Batches"));
const Students      = lazy(() => import("./pages/Students"));
const Problems      = lazy(() => import("./pages/Problems"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Reports       = lazy(() => import("./pages/Reports"));
const Settings      = lazy(() => import("./pages/Settings"));
const DataHub       = lazy(() => import("./pages/DataHub"));
const ManualEntry   = lazy(() => import("./pages/ManualEntry"));
const Exceptions    = lazy(() => import("./pages/Exceptions"));

export default function App() {
  return (
    <ThemeProvider>
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
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

            {/* DataHub & Manual Entry — HOD and Faculty only */}
            <Route element={<ProtectedRoute allowedRoles={["HOD", "Faculty"]} />}>
              <Route path="data-hub"      element={<DataHub />} />
              <Route path="manual-entry"  element={<ManualEntry />} />
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
      </Suspense>
    </HashRouter>
    </ThemeProvider>
  );
}
