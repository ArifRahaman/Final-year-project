import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowsePage from './pages/BrowsePage';
import CardDetailPage from './pages/CardDetailPage';
import CreateCardPage from './pages/CreateCardPage';
import EditCardPage from './pages/EditCardPage';
import MyLibraryPage from './pages/MyLibraryPage';
import AccessRequestsPage from './pages/AccessRequestsPage';
import VirtualLabsPage from './pages/VirtualLabsPage';
import OSSchedulingLab from './pages/labs/OSSchedulingLab';
import DatabaseQueryLab from './pages/labs/DatabaseQueryLab';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <div className="animated-bg" />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/labs" element={<VirtualLabsPage />} />
        <Route path="/labs/os-scheduling" element={<OSSchedulingLab />} />
        <Route path="/labs/db-query" element={<DatabaseQueryLab />} />
        <Route path="/cards/:id" element={<ProtectedRoute><CardDetailPage /></ProtectedRoute>} />
        <Route path="/create-card" element={<ProtectedRoute role="teacher"><CreateCardPage /></ProtectedRoute>} />
        <Route path="/edit-card/:id" element={<ProtectedRoute role="teacher"><EditCardPage /></ProtectedRoute>} />
        <Route path="/my-library" element={<ProtectedRoute role="student"><MyLibraryPage /></ProtectedRoute>} />
        <Route path="/access-requests" element={<ProtectedRoute role="teacher"><AccessRequestsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1f35',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}
