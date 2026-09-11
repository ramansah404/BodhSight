import { Outlet, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Basic Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <Activity className="text-blue-600" />
          <span className="font-bold text-gray-900">BodhSight</span>
        </div>
        <nav className="p-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
            <li><Link to="/departments" className="hover:text-blue-600">Departments</Link></li>
            <li><Link to="/courses" className="hover:text-blue-600">Courses</Link></li>
            <li><Link to="/performance" className="hover:text-blue-600">Performance</Link></li>
            <li><Link to="/trends" className="hover:text-blue-600">Trends</Link></li>
            <li><Link to="/anomalies" className="hover:text-blue-600">Anomalies</Link></li>
            <li><Link to="/alerts" className="hover:text-blue-600">Alerts</Link></li>
            <li><Link to="/interventions" className="hover:text-blue-600">Interventions</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
