import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight, Refresh, Search } from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { fetchActivityLogs, type ActivityLog, type ActivityLogFilters, type ActivityLogsPage as ActivityLogsPageData } from '../../api/adminApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchUsers } from '../../api/usersApi';
import type { ProjectListItem, UserListItem } from '../../types';

const ACTIONS = [
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'SPRINT_CREATED',
  'SPRINT_UPDATED',
  'SPRINT_STARTED',
  'SPRINT_FINISHED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_MOVED',
  'TASK_ASSIGNED',
  'TASK_DELETED',
  'TASK_COMPLETED',
  'STORY_CREATED',
  'STORY_UPDATED',
  'STORY_DELETED',
  'STORY_PLANNED',
  'STORY_UNPLANNED',
];

const actionLabel = (action: string) => action
  .toLowerCase()
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const formatDateTime = (value: string) => {
  try {
    return format(new Date(value), 'dd MMM yyyy HH:mm', { locale: fr });
  } catch {
    return value;
  }
};

const groupKey = (log: ActivityLog, groupBy: string) => {
  if (groupBy === 'PROJECT') return log.projectName || 'Sans projet';
  if (groupBy === 'USER') return log.actorName;
  return format(new Date(`${log.activityDate}T00:00:00`), 'dd MMM yyyy', { locale: fr });
};

const ActivityLogsPage = () => {
  const { user } = useAuth();
  const [logsPage, setLogsPage] = useState<ActivityLogsPageData | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [filters, setFilters] = useState<ActivityLogFilters>({});
  const [groupBy, setGroupBy] = useState('DATE');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLookups = useCallback(async () => {
    try {
      const [projectRows, userRows] = await Promise.all([fetchProjects(), fetchUsers()]);
      setProjects(projectRows);
      setUsers(userRows);
    } catch {
      setProjects([]);
      setUsers([]);
    }
  }, []);

  const loadLogs = useCallback(async (page = 0, nextFilters: ActivityLogFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityLogs(page, 20, nextFilters);
      setLogsPage(data);
    } catch {
      setError("Impossible de charger les journaux d'activite.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
      setLoading(false);
      return;
    }
    loadLookups();
    loadLogs(0, filters);
  }, [loadLogs, loadLookups, user?.role]);

  const currentPage = logsPage?.number ?? 0;
  const totalPages = logsPage?.totalPages ?? 0;
  const logs = logsPage?.content ?? [];
  const hasNextPage = currentPage < totalPages - 1;
  const groupedLogs = useMemo(() => logs.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const key = groupKey(log, groupBy);
    acc[key] = [...(acc[key] ?? []), log];
    return acc;
  }, {}), [logs, groupBy]);

  if (user?.role !== 'ROLE_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const updateFilter = (key: keyof ActivityLogFilters, value: string | number) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      loadLogs(0, next);
      return next;
    });
  };

  const resetFilters = () => {
    const empty = {};
    setFilters(empty);
    loadLogs(0, empty);
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Activity Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Historique filtre et groupe des actions importantes.
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={() => loadLogs(currentPage, filters)} disabled={loading}>
          Actualiser
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 1.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1} alignItems={{ xs: 'stretch', xl: 'center' }}>
          <TextField
            size="small"
            placeholder="Rechercher message, acteur, projet..."
            value={filters.q ?? ''}
            onChange={(e) => updateFilter('q', e.target.value)}
            sx={{ minWidth: { xl: 260 }, flex: 1 }}
            InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="log-project-label">Projet</InputLabel>
            <Select labelId="log-project-label" label="Projet" value={filters.projectId ?? ''} onChange={(e) => updateFilter('projectId', e.target.value as number | '')}>
              <MenuItem value="">Tous les projets</MenuItem>
              {projects.map((project) => <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="log-user-label">Acteur</InputLabel>
            <Select labelId="log-user-label" label="Acteur" value={filters.actorId ?? ''} onChange={(e) => updateFilter('actorId', e.target.value as number | '')}>
              <MenuItem value="">Tous les acteurs</MenuItem>
              {users.map((row) => <MenuItem key={row.id} value={row.id}>{row.firstName} {row.lastName}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 165 }}>
            <InputLabel id="log-action-label">Action</InputLabel>
            <Select labelId="log-action-label" label="Action" value={filters.action ?? ''} onChange={(e) => updateFilter('action', e.target.value)}>
              <MenuItem value="">Toutes</MenuItem>
              {ACTIONS.map((action) => <MenuItem key={action} value={action}>{actionLabel(action)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="group-by-label">Grouper par</InputLabel>
            <Select labelId="group-by-label" label="Grouper par" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <MenuItem value="DATE">Date</MenuItem>
              <MenuItem value="PROJECT">Projet</MenuItem>
              <MenuItem value="USER">Utilisateur</MenuItem>
            </Select>
          </FormControl>
          <Button onClick={resetFilters} size="small">Reinitialiser</Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading && logs.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : logs.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography color="text.secondary">Aucune activite enregistree.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {Object.entries(groupedLogs).map(([label, groupLogs]) => (
            <Paper key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ px: 1.5, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => toggleGroup(label)} aria-label={collapsedGroups[label] ? `Ouvrir ${label}` : `Fermer ${label}`}>
                    {collapsedGroups[label] ? <KeyboardArrowRight fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                  </IconButton>
                  <Typography fontWeight={800}>{label}</Typography>
                </Box>
                <Chip label={`${groupLogs.length} actions`} size="small" />
              </Box>
              <Collapse in={!collapsedGroups[label]} timeout="auto" unmountOnExit>
                <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                  {groupLogs.map((log) => (
                    <Box key={log.id} sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '150px 1fr 180px' }, gap: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(log.createdAt)}</Typography>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="body2" fontWeight={800}>{log.actorName}</Typography>
                          <Chip label={actionLabel(log.action)} size="small" />
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{log.message ?? '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Contexte</Typography>
                        <Typography variant="body2">{log.taskTitle || log.sprintName || log.projectName || 'Sans cible'}</Typography>
                        {log.projectName && <Typography variant="caption" color="text.secondary">{log.projectName}</Typography>}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Page {totalPages === 0 ? 0 : currentPage + 1} / {totalPages}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => loadLogs(currentPage - 1, filters)} disabled={loading || currentPage === 0}>Precedent</Button>
              <Button size="small" onClick={() => loadLogs(currentPage + 1, filters)} disabled={loading || !hasNextPage}>Suivant</Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default ActivityLogsPage;
