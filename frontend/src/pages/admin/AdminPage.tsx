import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material';
import {
  AccountTree,
  Assignment,
  Group,
  People,
  Task,
} from '@mui/icons-material';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchActivityLogs, fetchAdminDashboard, type ActivityLog, type AdminDashboard } from '../../api/adminApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchUsers } from '../../api/usersApi';
import type { ProjectListItem, UserListItem } from '../../types';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
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

const actionLabel = (action: string) => action
  .toLowerCase()
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, logs, userRows, projectRows] = await Promise.all([
        fetchAdminDashboard(),
        fetchActivityLogs(0, 5),
        fetchUsers(),
        fetchProjects(),
      ]);
      setData(dashboard);
      setRecentLogs(logs.content);
      setUsers(userRows);
      setProjects(projectRows);
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

  const activeProjects = projects.filter((project) => project.status === 'ACTIF').length;
  const archivedProjects = projects.filter((project) => project.status === 'ARCHIVE').length;
  const finishedProjects = projects.filter((project) => project.status === 'TERMINE').length;
  const admins = users.filter((row) => row.role === 'ROLE_ADMIN').length;
  const managers = users.filter((row) => row.role === 'ROLE_MANAGER').length;
  const developers = users.filter((row) => row.role === 'ROLE_DEVELOPER').length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
        Tableau de bord administrateur
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue d'ensemble de la plateforme et des actions recentes.
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
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Utilisateurs" value={data.totalUsers} icon={<People sx={{ fontSize: 40 }} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Utilisateurs actifs" value={data.activeUsers} icon={<People sx={{ fontSize: 40 }} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Projets" value={data.totalProjects} icon={<Assignment sx={{ fontSize: 40 }} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Taches" value={data.totalTasks} icon={<Task sx={{ fontSize: 40 }} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Equipes" value={data.totalTeams} icon={<Group sx={{ fontSize: 40 }} />} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard title="Diagrammes" value={data.totalDiagrams} icon={<AccountTree sx={{ fontSize: 40 }} />} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={6}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Structure plateforme</Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Roles utilisateurs</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`${admins} admins`} color="error" variant="outlined" />
                      <Chip label={`${managers} managers`} color="warning" variant="outlined" />
                      <Chip label={`${developers} developpeurs`} color="info" variant="outlined" />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Etat des projets</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`${activeProjects} actifs`} color="success" variant="outlined" />
                      <Chip label={`${finishedProjects} termines`} color="primary" variant="outlined" />
                      <Chip label={`${archivedProjects} archives`} variant="outlined" />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={800}>Activite recente</Typography>
                  <Button size="small" onClick={() => navigate('/activity-logs')}>Tout voir</Button>
                </Stack>
                <Stack spacing={1.5}>
                  {recentLogs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Aucune activite recente.</Typography>
                  ) : recentLogs.map((log) => (
                    <Box key={log.id}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={700}>{log.actorName}</Typography>
                        <Chip label={actionLabel(log.action)} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{log.message ?? '-'}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminPage;
