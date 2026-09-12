import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { lazy, Suspense } from "react";
import LoadingFallback from "./components/ui/LoadingFallback";

const Landing = lazy(() => import("./pages/Landing"));
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

export default function App() {
  return (
    <ThemeProvider>
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Landing />} />
        
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
            <Route path="trends" element={<Trends />} />
          </Route>
          <Route path="courses" element={<Courses />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean"]} />}>
            <Route path="departments" element={<Departments />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
            <Route path="batches" element={<Batches />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "Dean", "HOD", "Faculty"]} />}>
            <Route path="sections" element={<Sections />} />
            <Route path="students" element={<Students />} />
          </Route>
          <Route path="anomalies" element={<Problems />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Principal", "IQAC", "Dean", "HOD"]} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </HashRouter>
    </ThemeProvider>
  );
}
