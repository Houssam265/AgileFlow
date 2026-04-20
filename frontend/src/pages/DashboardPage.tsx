import { Box, Grid, Paper, Typography, Avatar, Chip, Button } from '@mui/material';
import { Group, Assignment, Timeline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Utilisateur';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

      {/* ── Header de bienvenue ─────────────────────────────── */}
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
              Bonjour, {fullName} 👋
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, opacity: 0.85 }}>
              Bienvenue sur votre tableau de bord AgileFlow
            </Typography>
          </Box>
        </Box>
        <Chip
          label={user?.role?.replace('ROLE_', '') ?? 'USER'}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 13, px: 1 }}
        />
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Assignment color="primary" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Projets</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Consultez et organisez les projets de l&apos;équipe.
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/projects')}>Ouvrir</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Group color="primary" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Utilisateurs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gérez les profils, rôles et accès des utilisateurs.
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/users')}>Ouvrir</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Group color="primary" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Équipes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Créez des équipes et gérez leurs membres.
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/teams')}>Ouvrir</Button>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Timeline color="primary" />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Sprints</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Suivez l&apos;avancement des sprints et itérations.
            </Typography>
            <Button sx={{ mt: 2 }} onClick={() => navigate('/sprints')}>Ouvrir</Button>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700}>Tableau de bord</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Les indicateurs en temps réel seront affichés ici lorsque les modules analytics seront connectés.
        </Typography>
      </Paper>

    </Box>
  );
};

export default DashboardPage;
