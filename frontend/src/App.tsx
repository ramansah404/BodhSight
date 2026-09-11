import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Exceptions from "./pages/Exceptions";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";
import Trends from "./pages/Trends";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* We use Layout as the primary layout since it was newly built, but preserve paths */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="departments" element={<Departments />} />
          <Route path="sections" element={<Sections />} />
          <Route path="trends" element={<Trends />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="reports" element={<Reports />} />
          
          {/* Placeholders from my side that the teammate didn't explicitly overwrite */}
          <Route path="performance" element={<div>Performance Trends Module placeholder</div>} />
          <Route path="anomalies" element={<div>Anomaly Detection Module placeholder</div>} />
          <Route path="alerts" element={<div>Alerts Module placeholder</div>} />
          <Route path="interventions" element={<div>Interventions Module placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
