import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AppLayout    from '../components/layout/AppLayout';
import LoginPage    from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import UsersListPage from '../pages/users/UsersListPage';
import UserProfilePage from '../pages/users/UserProfilePage';
import TeamsPage from '../pages/teams/TeamsPage';
import TeamDetailsPage from '../pages/teams/TeamDetailsPage';

// ── Route protégée avec contrôle de rôle optionnel ──
const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout />;
};

// ── Page 403 simple ──
const UnauthorizedPage = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 24 }}>
    🔒 Accès refusé
  </div>
);

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Routes publiques */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Routes protégées — tous les rôles */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects"  element={<div>Projets — à venir</div>} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />
        <Route path="/sprints"   element={<div>Sprints — à venir</div>} />
        <Route path="/settings"  element={<div>Paramètres — à venir</div>} />
      </Route>

      {/* Routes réservées aux admins */}
      <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
        <Route path="/admin" element={<div>Administration — à venir</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;