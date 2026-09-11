import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [currentRole, setCurrentRole] = useState('Dean');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Topbar currentRole={currentRole} setRole={setCurrentRole} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet context={{ currentRole }} />
        </main>
      </div>
    </div>
  );
}
