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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Assessment, Download, Refresh } from '@mui/icons-material';
import { exportAnalyticsPdf, fetchAnalytics } from '../../api/analyticsApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import ActivityHeatmap from '../../components/analytics/ActivityHeatmap';
import MemberStats from '../../components/analytics/MemberStats';
import type { AnalyticsData, AnalyticsPeriod, ProjectListItem } from '../../types';

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  WEEK: 'Semaine',
  MONTH: 'Mois',
  SPRINT: 'Sprint',
};

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('WEEK');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | ''>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const requestParams = useMemo(() => ({
    period,
    ...(period === 'SPRINT' && selectedSprintId ? { sprintId: selectedSprintId } : {}),
  }), [period, selectedSprintId]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      setSelectedProjectId((current) => current || data[0]?.id || '');
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
      setSelectedSprintId((current) => {
        if (current && data.some((sprint) => sprint.id === current)) return current;
        const activeSprint = data.find((sprint) => sprint.statut === 'EN_COURS');
        return activeSprint?.id || data[0]?.id || '';
      });
    } catch {
      setSprints([]);
      setSelectedSprintId('');
    }
  }, [selectedProjectId]);

  const loadAnalytics = useCallback(async () => {
    if (period === 'SPRINT' && !selectedSprintId) {
      setAnalytics(null);
      setLoading(false);
      setError('Selectionnez un sprint pour afficher les analytics.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalytics(requestParams);
      setAnalytics(data);
    } catch {
      setError('Impossible de charger les analytics.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [period, requestParams, selectedSprintId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = async () => {
    if (period === 'SPRINT' && !selectedSprintId) return;
    setExporting(true);
    try {
      const blob = await exportAnalyticsPdf(requestParams);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agileflow-analytics-${period.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnack('Export PDF genere.');
    } catch {
      setSnack('Export PDF impossible.');
    } finally {
      setExporting(false);
    }
  };

  const metricCards = analytics
    ? [
        { label: 'Activites', value: analytics.totalActivities },
        { label: 'Taches terminees', value: analytics.completedTasks },
        { label: 'Membres actifs', value: analytics.activeMembers },
      ]
    : [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Assessment color="primary" />
            <Typography variant="h5" fontWeight={800}>Analytics Dashboard</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Vue consolidee des activites par periode, membre et date.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button startIcon={<Refresh />} onClick={loadAnalytics} disabled={loading}>
            Actualiser
          </Button>
          <Button variant="contained" startIcon={<Download />} onClick={handleExport} disabled={exporting || loading || (period === 'SPRINT' && !selectedSprintId)}>
            {exporting ? 'Export...' : 'Exporter PDF'}
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, nextPeriod: AnalyticsPeriod | null) => {
              if (nextPeriod) setPeriod(nextPeriod);
            }}
          >
            {(Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]).map((value) => (
              <ToggleButton key={value} value={value}>{PERIOD_LABELS[value]}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          {period === 'SPRINT' && (
            <>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel id="analytics-project-label">Projet</InputLabel>
                <Select
                  labelId="analytics-project-label"
                  label="Projet"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value as number)}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="analytics-sprint-label">Sprint</InputLabel>
                <Select
                  labelId="analytics-sprint-label"
                  label="Sprint"
                  value={selectedSprintId}
                  disabled={sprints.length === 0}
                  onChange={(event) => setSelectedSprintId(event.target.value as number)}
                >
                  {sprints.map((sprint) => (
                    <MenuItem key={sprint.id} value={sprint.id}>{sprint.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : analytics ? (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            {metricCards.map((metric) => (
              <Grid item xs={12} md={4} key={metric.label}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{metric.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary">
              Periode analysee: {analytics.startDate} - {analytics.endDate}
            </Typography>
          </Paper>

          <ActivityHeatmap items={analytics.heatmap} />
          <MemberStats memberStats={analytics.memberStats} trend={analytics.trend} />
        </Stack>
      ) : (
        <Alert severity="info">Aucune donnee analytics disponible pour ce filtre.</Alert>
      )}

      <Snackbar open={snack != null} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
};

export default AnalyticsDashboard;
