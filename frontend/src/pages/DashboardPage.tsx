import React from 'react';
import { Box, Grid, Paper, Typography, Avatar, Chip, LinearProgress, Divider } from '@mui/material';
import {
  Assignment, Group, Timeline, CheckCircleOutline,
  TrendingUp, FiberManualRecord,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ── Carte de statistique ──────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  gradient: string;
  progress: number;
}

const StatCard = ({ icon, label, value, subtitle, gradient, progress }: StatCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      background: gradient,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      '&::after': {
        content: '""',
        position: 'absolute',
        right: -20,
        top: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.2, display: 'flex' }}>
        {icon}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendingUp fontSize="small" />
        <Typography variant="caption" fontWeight={600}>+12%</Typography>
      </Box>
    </Box>
    <Typography variant="h3" fontWeight={800} lineHeight={1}>{value}</Typography>
    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, opacity: 0.95 }}>{label}</Typography>
    <Typography variant="caption" sx={{ opacity: 0.75 }}>{subtitle}</Typography>
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        mt: 2,
        height: 4,
        borderRadius: 2,
        bgcolor: 'rgba(255,255,255,0.2)',
        '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 2 },
      }}
    />
  </Paper>
);

// ── Activité récente ──────────────────────────────────────────────────────────
const activities = [
  { color: '#3b82f6', text: 'Sprint "Authentification" démarré', time: 'Il y a 2h',   dot: '#3b82f6' },
  { color: '#10b981', text: 'Tâche #42 marquée comme terminée',  time: 'Il y a 4h',   dot: '#10b981' },
  { color: '#f59e0b', text: 'Nouvelle équipe "Frontend" créée',  time: 'Hier',        dot: '#f59e0b' },
  { color: '#8b5cf6', text: 'Projet "AgileFlow V2" planifié',    time: 'Il y a 2j',   dot: '#8b5cf6' },
];

// ── Sprints actifs ────────────────────────────────────────────────────────────
const sprints = [
  { name: 'Sprint Auth',     progress: 75, color: '#3b82f6' },
  { name: 'Sprint UI',       progress: 45, color: '#8b5cf6' },
  { name: 'Sprint API Plus', progress: 20, color: '#f59e0b' },
];

// ── Composant principal ───────────────────────────────────────────────────────
const DashboardPage = () => {
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

      {/* ── Stats Cards ─────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Assignment sx={{ color: 'white' }} />}
            label="Projets actifs"
            value="8"
            subtitle="4 en cours ce mois"
            gradient="linear-gradient(135deg, #2563eb, #3b82f6)"
            progress={65}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Group sx={{ color: 'white' }} />}
            label="Membres"
            value="24"
            subtitle="3 nouveaux cette semaine"
            gradient="linear-gradient(135deg, #7c3aed, #8b5cf6)"
            progress={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Timeline sx={{ color: 'white' }} />}
            label="Sprints actifs"
            value="3"
            subtitle="2 se terminent bientôt"
            gradient="linear-gradient(135deg, #d97706, #f59e0b)"
            progress={45}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<CheckCircleOutline sx={{ color: 'white' }} />}
            label="Tâches terminées"
            value="142"
            subtitle="23 terminées aujourd'hui"
            gradient="linear-gradient(135deg, #059669, #10b981)"
            progress={90}
          />
        </Grid>
      </Grid>

      {/* ── Activité récente + Sprints ───────────────────────── */}
      <Grid container spacing={2.5}>

        {/* Activité récente */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Activité récente</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activities.map((a, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FiberManualRecord sx={{ color: a.dot, fontSize: 12, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{a.text}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{a.time}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Progression des sprints */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Progression des sprints</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {sprints.map((s, i) => (
                <Box key={i}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{s.progress}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={s.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.100',
                      '& .MuiLinearProgress-bar': { bgcolor: s.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

export default DashboardPage;
