import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
