import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Events from './pages/Events';
import LostFound from './pages/LostFound';
import Clubs from './pages/Clubs';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminLogs from './pages/AdminLogs';
import AdminSettings from './pages/AdminSettings';
import { hasPermission } from './utils/roles';
import { LayoutDashboard, FileText, Calendar, Search, Users, AlertCircle, LogOut, UserPlus, User, Settings, List, Wrench } from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/resources', icon: <FileText size={20} />, label: 'Resources' },
    { path: '/events', icon: <Calendar size={20} />, label: 'Events' },
    { path: '/lost-found', icon: <Search size={20} />, label: 'Lost & Found' },
    { path: '/clubs', icon: <Users size={20} />, label: 'Clubs' },
    { path: '/reports', icon: <AlertCircle size={20} />, label: 'Reports' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  if (hasPermission(user, 'manage_users') || hasPermission(user, 'manage_non_admin_users')) {
    navItems.push({ path: '/register', icon: <UserPlus size={20} />, label: 'Registration' });
    navItems.push({ path: '/admin/users', icon: <Settings size={20} />, label: 'User Admin' });
  }

  if (hasPermission(user, 'view_audit_logs')) {
    navItems.push({ path: '/admin/logs', icon: <List size={20} />, label: 'Audit Logs' });
  }

  if (hasPermission(user, 'manage_settings')) {
    navItems.push({ path: '/admin/settings', icon: <Wrench size={20} />, label: 'Campus Settings' });
  }

  return (
    <aside className="sidebar">
      <h2>Campus Hub</h2>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path} style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Layout = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute>
              <Layout><Register /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/resources" element={
            <ProtectedRoute>
              <Layout><Resources /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <Layout><Events /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/lost-found" element={
            <ProtectedRoute>
              <Layout><LostFound /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute>
              <Layout><Clubs /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <Layout><AdminUsers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute>
              <Layout><AdminLogs /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <Layout><AdminSettings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
