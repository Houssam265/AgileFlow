import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Assessment, Download, Refresh } from '@mui/icons-material';
import { exportAnalyticsPdf, fetchAnalytics } from '../../api/analyticsApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import type { AnalyticsData, AnalyticsPeriod, ProjectListItem } from '../../types';

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  WEEK: 'Semaine',
  MONTH: 'Mois',
  SPRINT: 'Sprint',
};

const shortDate = (date: string) => date.slice(5);

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
        { label: 'Activites', value: analytics.totalActivities, icon: '⚡' },
        { label: 'Taches terminees', value: analytics.completedTasks, icon: '✓' },
        { label: 'Membres actifs', value: analytics.activeMembers, icon: '👥' },
      ]
    : [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Analytics Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vue consolidee des activites par periode, membre et date.
      </Typography>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }} justifyContent="space-between">
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
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button size="small" startIcon={<Refresh />} onClick={loadAnalytics} disabled={loading}>
              Actualiser
            </Button>
            <Button size="small" variant="contained" startIcon={<Download />} onClick={handleExport} disabled={exporting || loading || (period === 'SPRINT' && !selectedSprintId)}>
              {exporting ? 'Export...' : 'Exporter PDF'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : analytics ? (
        <Grid container spacing={2}>
          {/* KPI Cards Row */}
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={metricCards[0]?.label} value={metricCards[0]?.value ?? 0} icon={<Assessment sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={metricCards[1]?.label} value={metricCards[1]?.value ?? 0} icon={<Assessment sx={{ fontSize: 40 }} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={metricCards[2]?.label} value={metricCards[2]?.value ?? 0} icon={<Assessment sx={{ fontSize: 40 }} />} />
          </Grid>

          {/* Member Stats and Trend Side by Side */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>Statistiques membres</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Volume d'activite et taches terminees par membre.
                </Typography>
              </Box>
              {analytics.memberStats.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucune activite sur la periode.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <BarChart width={Math.max(480, analytics.memberStats.length * 140)} height={280} data={analytics.memberStats} margin={{ top: 8, right: 24, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="memberName" angle={-20} textAnchor="end" height={58} interval={0} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="activityCount" name="Activites" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completedTasks" name="Taches terminees" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>Evolution quotidienne</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Ligne de tendance des activites et taches terminees.
                </Typography>
              </Box>
              {analytics.trend.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucune donnee sur la periode.</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <LineChart width={Math.max(480, analytics.trend.length * 34)} height={280} data={analytics.trend.map((item) => ({ ...item, dateLabel: shortDate(item.date) }))} margin={{ top: 8, right: 24, left: 0, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dateLabel" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="activityCount" name="Activites" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completedTasks" name="Taches terminees" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">Aucune donnee analytics disponible pour ce filtre.</Alert>
      )}

      <Snackbar open={snack != null} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
};

export default AnalyticsDashboard;
