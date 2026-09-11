<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Dashboard from './pages/Dashboard';
=======
﻿import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Exceptions from "./pages/Exceptions";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";
import Trends from "./pages/Trends";
import Reports from "./pages/Reports";
>>>>>>> fdaa9ac071934d47fc97884694f45bdb8beab2b8

function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="departments" element={<div>Departments Module placeholder</div>} />
          <Route path="courses" element={<div>Courses Module placeholder</div>} />
          <Route path="performance" element={<div>Performance Trends Module placeholder</div>} />
          <Route path="trends" element={<div>Trends Module placeholder</div>} />
          <Route path="anomalies" element={<div>Anomaly Detection Module placeholder</div>} />
          <Route path="alerts" element={<div>Alerts Module placeholder</div>} />
          <Route path="interventions" element={<div>Interventions Module placeholder</div>} />
=======
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="departments" element={<Departments />} />
          <Route path="sections" element={<Sections />} />
          <Route path="trends" element={<Trends />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="reports" element={<Reports />} />
>>>>>>> fdaa9ac071934d47fc97884694f45bdb8beab2b8
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
