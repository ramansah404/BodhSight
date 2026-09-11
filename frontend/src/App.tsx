import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Exceptions from "./pages/Exceptions";
import Departments from "./pages/Departments";
import Sections from "./pages/Sections";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="departments" element={<Departments />} />
          <Route path="sections" element={<Sections />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="trends" element={<div className="p-8">Trends Page (Coming Soon)</div>} />
          <Route path="reports" element={<div className="p-8">Reports Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
