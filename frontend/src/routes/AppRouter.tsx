import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsListPage from '../pages/projects/ProjectsListPage';
import TeamsPage from '../pages/teams/TeamsPage';
import TeamDetailsPage from '../pages/teams/TeamDetailsPage';
import UserProfilePage from '../pages/users/UserProfilePage';
import UsersListPage from '../pages/users/UsersListPage';
import SprintsPage from '../pages/sprints/SprintsPage';
import BacklogPage from '../pages/backlog/BacklogPage';
import KanbanBoard from '../pages/kanban/KanbanBoard';

const AnalyticsDashboard = lazy(() => import('../pages/analytics/AnalyticsDashboard'));
const StatsPage = lazy(() => import('../pages/stats/StatsPage'));

const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
);

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout />;
};

const UnauthorizedPage = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 24 }}>
    Acces refuse
  </div>
);

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analytics" element={<LazyPage><AnalyticsDashboard /></LazyPage>} />
        <Route path="/stats" element={<LazyPage><StatsPage /></LazyPage>} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:id" element={<TeamDetailsPage />} />
        <Route path="/sprints" element={<SprintsPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/settings" element={<div>Parametres - a venir</div>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
        <Route path="/admin" element={<div>Administration - a venir</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
