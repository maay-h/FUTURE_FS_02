import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { Loading } from './components/UI';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import KanbanBoard from './pages/KanbanBoard';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Customers from './pages/Customers';
import { UsersManagement, EmailTemplates, EmailTriggers, LeadSources, Settings } from './pages/OtherPages';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullPage />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/leads" element={<PrivateRoute><AppLayout><Leads /></AppLayout></PrivateRoute>} />
      <Route path="/kanban" element={<PrivateRoute><AppLayout><KanbanBoard /></AppLayout></PrivateRoute>} />
      <Route path="/activities" element={<PrivateRoute><AppLayout><Activities /></AppLayout></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><AppLayout><Tasks /></AppLayout></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><AppLayout><Calendar /></AppLayout></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><AppLayout><Customers /></AppLayout></PrivateRoute>} />
      <Route path="/lead-sources" element={<PrivateRoute><AppLayout><LeadSources /></AppLayout></PrivateRoute>} />
      <Route path="/email-templates" element={<PrivateRoute><AppLayout><EmailTemplates /></AppLayout></PrivateRoute>} />
      <Route path="/email-triggers" element={<PrivateRoute><AppLayout><EmailTriggers /></AppLayout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute adminOnly><AppLayout><UsersManagement /></AppLayout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
