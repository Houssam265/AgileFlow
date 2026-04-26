import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { Assessment, Refresh } from '@mui/icons-material';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import { exportStatsCsv, exportStatsPdf, fetchStats, type StatsParams } from '../../api/statsApi';
import BurndownChart from '../../components/stats/BurndownChart';
import ExportButtons from '../../components/stats/ExportButtons';
import VelocityChart from '../../components/stats/VelocityChart';
import type { ProjectListItem, StatsData } from '../../types';

const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const StatsPage = () => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | ''>('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const params: StatsParams = useMemo(() => ({
    ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    ...(selectedSprintId ? { sprintId: selectedSprintId } : {}),
  }), [selectedProjectId, selectedSprintId]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch {
      setProjects([]);
    }
  }, []);

  const loadSprints = useCallback(async () => {
    if (!selectedProjectId) {
      setSprints([]);
      setSelectedSprintId('');
      return;
    }
    try {
      const data = await fetchSprintsByProject(selectedProjectId);
      setSprints(data);
      setSelectedSprintId((current) => (current && data.some((sprint) => sprint.id === current) ? current : ''));
    } catch {
      setSprints([]);
      setSelectedSprintId('');
    }
  }, [selectedProjectId]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats(params);
      setStats(data);
    } catch {
      setStats(null);
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      saveBlob(await exportStatsPdf(params), 'agileflow-stats.pdf');
      setSnack('Rapport PDF genere.');
    } catch {
      setSnack('Export PDF impossible.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      saveBlob(await exportStatsCsv(params), 'agileflow-stats.csv');
      setSnack('Export CSV genere.');
    } catch {
      setSnack('Export CSV impossible.');
    } finally {
      setExporting(false);
    }
  };

  const metrics = stats
    ? [
        { label: 'Taches', value: stats.totalTasks },
        { label: 'Terminees', value: stats.completedTasks },
        { label: 'Progression', value: `${stats.completionRate}%` },
        { label: 'Velocite moyenne', value: stats.averageVelocity },
      ]
    : [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Assessment color="primary" />
            <Typography variant="h5" fontWeight={800}>Stats & Rapports</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Burndown, velocity et exports PDF/CSV.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button startIcon={<Refresh />} onClick={loadStats} disabled={loading}>Actualiser</Button>
          <ExportButtons exporting={exporting} disabled={loading || !stats} onExportPdf={handleExportPdf} onExportCsv={handleExportCsv} />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="stats-project-label">Projet</InputLabel>
            <Select
              labelId="stats-project-label"
              label="Projet"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value as number | '')}
            >
              <MenuItem value="">Tous les projets</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel id="stats-sprint-label">Sprint</InputLabel>
            <Select
              labelId="stats-sprint-label"
              label="Sprint"
              value={selectedSprintId}
              disabled={!selectedProjectId || sprints.length === 0}
              onChange={(event) => setSelectedSprintId(event.target.value as number | '')}
            >
              <MenuItem value="">Tous les sprints</MenuItem>
              {sprints.map((sprint) => (
                <MenuItem key={sprint.id} value={sprint.id}>{sprint.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : stats ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {metrics.map((metric) => (
              <Grid item xs={12} sm={6} lg={3} key={metric.label}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{metric.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" color="text.secondary">TODO</Typography>
                <Typography variant="h6" fontWeight={800}>{stats.todoTasks}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" color="text.secondary">En cours</Typography>
                <Typography variant="h6" fontWeight={800}>{stats.inProgressTasks}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" color="text.secondary">Review</Typography>
                <Typography variant="h6" fontWeight={800}>{stats.reviewTasks}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="body2" color="text.secondary">Sprints actifs</Typography>
                <Typography variant="h6" fontWeight={800}>{stats.activeSprints}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary">
              Periode du burndown: {stats.startDate} - {stats.endDate}
            </Typography>
          </Paper>

          <BurndownChart points={stats.burndown} />
          <VelocityChart points={stats.velocity} />
        </Stack>
      ) : (
        <Alert severity="info">Aucune statistique disponible.</Alert>
      )}

      <Snackbar open={snack != null} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
};

export default StatsPage;
