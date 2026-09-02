import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-[#faf9f8]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}