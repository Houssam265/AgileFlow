import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Assignment, Group, ManageAccounts, Timeline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../api/dashboardApi';
import { fetchProjects } from '../api/projectsApi';
import ProjectStats from '../components/dashboard/ProjectStats';
import ProjectCard from '../components/projects/ProjectCard';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, ProjectListItem } from '../types';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Utilisateur';

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashboardStats, projectRows] = await Promise.all([fetchDashboardStats(), fetchProjects()]);
        if (!active) return;
        setStats(dashboardStats);
        setProjects(projectRows.slice(0, 3));
      } catch {
        if (!active) return;
        setError('Impossible de charger les donnees du dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Avatar
            sx={{ width: 64, height: 64, fontSize: 26, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}
          >
            {user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
              Bonjour, {fullName}
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.85 }}>
              Vue rapide sur les projets, equipes et taches.
            </Typography>
          </Box>
        </Box>
        <Chip
          label={user?.role?.replace('ROLE_', '') ?? 'USER'}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 13, px: 1 }}
        />
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 3 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', flex: 1 }}>
          <Assignment color="primary" />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Projets</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Creez, assignez et priorisez les projets actifs.
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/projects')}>Ouvrir</Button>
        </Paper>
        {user?.role === 'ROLE_ADMIN' && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', flex: 1 }}>
            <ManageAccounts color="primary" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Utilisateurs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gere les profils, roles et acces des utilisateurs.
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/users')}>Ouvrir</Button>
          </Paper>
        )}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', flex: 1 }}>
          <Group color="primary" />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Equipes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Structure les equipes et leur responsabilite.
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/teams')}>Ouvrir</Button>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', flex: 1 }}>
          <Timeline color="primary" />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Sprints</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Visualise les sprints actifs et leur charge.
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/sprints')}>Ouvrir</Button>
        </Paper>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : stats ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Indicateurs</Typography>
            <ProjectStats stats={stats} />
          </Box>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
              <Typography variant="h6" fontWeight={700}>Projets recents</Typography>
              <Button onClick={() => navigate('/projects')}>Voir tout</Button>
            </Box>
            {projects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Aucun projet disponible pour le moment.</Typography>
            ) : (
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5}>
                {projects.map((project) => (
                  <Box key={project.id} sx={{ flex: 1, minWidth: 0 }}>
                    <ProjectCard project={project} />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      ) : null}
    </Box>
  );
};

export default DashboardPage;
