import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import {
  AccountTree,
  Assignment,
  Group,
  NotificationsActive,
  People,
  Task,
} from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminDashboard, type AdminDashboard } from '../../api/adminApi';
import UserManagement from '../../components/users/UserManagement';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: 'primary.main', opacity: 0.85 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchAdminDashboard();
      setData(d);
    } catch {
      setError('Impossible de charger le tableau de bord administrateur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      setLoading(false);
      return;
    }
    load();
  }, [user?.role, load]);

  if (user?.role !== 'ROLE_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
        Administration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue d’ensemble de la plateforme et gestion des comptes.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading || !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Utilisateurs (total)" value={data.totalUsers} icon={<People sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Utilisateurs actifs" value={data.activeUsers} icon={<People sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Projets" value={data.totalProjects} icon={<Assignment sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Tâches" value={data.totalTasks} icon={<Task sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Équipes" value={data.totalTeams} icon={<Group sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Diagrammes" value={data.totalDiagrams} icon={<AccountTree sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Notifications (total)"
              value={data.totalNotifications}
              icon={<NotificationsActive sx={{ fontSize: 40 }} />}
            />
          </Grid>
        </Grid>
      )}

      <UserManagement variant="embedded" />
    </Box>
  );
};

export default AdminPage;
