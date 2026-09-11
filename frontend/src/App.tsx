import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trends from "./pages/Trends";
import Courses from "./pages/Courses";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";
import Batches from "./pages/Batches";
import Students from "./pages/Students";
import Anomalies from "./pages/Anomalies";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Landing />} />
        
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Dean", "HOD"]} />}>
            <Route path="trends" element={<Trends />} />
          </Route>
          <Route path="courses" element={<Courses />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Dean"]} />}>
            <Route path="departments" element={<Departments />} />
          </Route>
          <Route path="sections" element={<Sections />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Dean", "HOD"]} />}>
            <Route path="batches" element={<Batches />} />
          </Route>
          <Route path="students" element={<Students />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route element={<ProtectedRoute allowedRoles={["Chairman", "Dean"]} />}>
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
