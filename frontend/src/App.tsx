import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* We will build these pages in the next step */}
          <Route path="courses" element={<div className="p-8">Course Performance Page (Coming Soon)</div>} />
          <Route path="departments" element={<div className="p-8">Departments Page (Coming Soon)</div>} />
          <Route path="sections" element={<div className="p-8">Section Comparison Page (Coming Soon)</div>} />
          <Route path="trends" element={<div className="p-8">Trends Page (Coming Soon)</div>} />
          <Route path="exceptions" element={<div className="p-8">Exception Center (Coming Soon)</div>} />
          <Route path="reports" element={<div className="p-8">Reports Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

