import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";
import Trends from "./pages/Trends";
import Anomalies from "./pages/Anomalies";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Batches from "./pages/Batches";
import Students from "./pages/Students";
import Recommendations from "./pages/Recommendations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="performance" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="departments" element={<Departments />} />
          <Route path="sections" element={<Sections />} />
          <Route path="batches" element={<Batches />} />
          <Route path="students" element={<Students />} />
          <Route path="trends" element={<Trends />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
