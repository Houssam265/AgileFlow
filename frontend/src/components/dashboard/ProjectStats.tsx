import { Grid, Paper, Typography } from '@mui/material';
import type { DashboardStats } from '../../types';

type Props = {
  stats: DashboardStats;
};

const items = (stats: DashboardStats) => [
  { label: 'Projets', value: stats.totalProjects },
  { label: 'Projets actifs', value: stats.activeProjects },
  { label: 'Sprints actifs', value: stats.activeSprints },
  { label: 'Taches', value: stats.totalTasks },
  { label: 'A faire', value: stats.todoTasks },
  { label: 'En cours', value: stats.inProgressTasks },
  { label: 'Terminees', value: stats.doneTasks },
  { label: 'Equipes gerees', value: stats.managedTeams },
];

const ProjectStats = ({ stats }: Props) => (
  <Grid container spacing={2.5}>
    {items(stats).map((item) => (
      <Grid item xs={12} sm={6} lg={3} key={item.label}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">{item.label}</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{item.value}</Typography>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export default ProjectStats;
