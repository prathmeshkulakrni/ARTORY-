import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1A1A2E', color: '#E2E8F0', border: '1px solid #2D2D4E' },
        success: { iconTheme: { primary: '#8B5CF6', secondary: '#fff' } },
      }} />
    </div>
  );
}
