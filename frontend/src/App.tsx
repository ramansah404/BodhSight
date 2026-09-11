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
          <Route path="performance" element={<div>Performance Trends Module placeholder</div>} />
          <Route path="anomalies" element={<div>Anomaly Detection Module placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
