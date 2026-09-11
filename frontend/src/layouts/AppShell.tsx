import { Outlet } from 'react-router-dom';
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
            <li>Dashboard</li>
            <li>Performance</li>
            <li>Trends</li>
            <li>Anomalies</li>
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
