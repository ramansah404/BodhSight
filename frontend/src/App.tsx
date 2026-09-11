import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
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
        
        <Route path="/" element={<Layout />}>
          {/* Universal Authorized Overview */}
          <Route index element={<Dashboard />} />
          
          {/* Trends: Principal, Management, IQAC, Dean, HOD */}
          <Route element={<ProtectedRoute allowedRoles={["Dean", "HOD", "Principal", "Management", "IQAC"]} />}>
            <Route path="trends" element={<Trends />} />
          </Route>

          {/* Courses: All Roles */}
          <Route path="courses" element={<Courses />} />

          {/* Departments: Principal, Management, IQAC, Dean */}
          <Route element={<ProtectedRoute allowedRoles={["Dean", "Principal", "Management", "IQAC"]} />}>
            <Route path="departments" element={<Departments />} />
          </Route>

          {/* Sections: Dean, HOD, Faculty */}
          <Route path="sections" element={<Sections />} />

          {/* Batches: Principal, Management, Dean, HOD */}
          <Route element={<ProtectedRoute allowedRoles={["Dean", "HOD", "Principal", "Management"]} />}>
            <Route path="batches" element={<Batches />} />
          </Route>

          {/* Students (At-Risk): Dean, HOD, Faculty */}
          <Route path="students" element={<Students />} />

          {/* Anomalies: All Roles */}
          <Route path="anomalies" element={<Anomalies />} />

          {/* Recommendations: All Roles */}
          <Route path="recommendations" element={<Recommendations />} />

          {/* Executive Reports: Principal, Management, IQAC, Dean ONLY (Strictly barred from Faculty & HOD) */}
          <Route element={<ProtectedRoute allowedRoles={["Dean", "Principal", "Management", "IQAC"]} />}>
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Settings: All Roles */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
