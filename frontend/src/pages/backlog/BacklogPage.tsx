import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  Layers,
  Search,
  ViewColumn,
} from '@mui/icons-material';
import { addMonths, subMonths } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import {
  assignStoryToSprint,
  createUserStory,
  deleteUserStory,
  fetchBacklogByProject,
  removeStoryFromSprint,
  updateUserStory,
} from '../../api/backlogApi';
import { createEpic, deleteEpic, updateEpic } from '../../api/epicsApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import { fetchTasksByProject } from '../../api/tasksApi';
import type {
  CreateEpicPayload,
  CreateUserStoryPayload,
  EpicItem,
  EpicStatus,
  ProjectListItem,
  StoryPriority,
  TaskItem,
  UserStoryItem,
} from '../../types';
import CreateStoryModal from '../../components/backlog/CreateStoryModal';
import CreateEpicModal from '../../components/backlog/CreateEpicModal';
import BacklogEpicView from '../../components/backlog/BacklogEpicView';
import SprintPlanningBoard from '../../components/backlog/SprintPlanningBoard';
import PlanningCalendar from '../../components/backlog/PlanningCalendar';
import PlanningOverview from '../../components/backlog/PlanningOverview';
import EpicStatusBoard from '../../components/backlog/EpicStatusBoard';
import StoryDetailDrawer from '../../components/backlog/StoryDetailDrawer';

const TABS = ['backlog', 'epics', 'planning', 'calendar'] as const;
type TabKey = typeof TABS[number];

const BacklogPage = () => {
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [priority, setPriority] = useState<StoryPriority | 'ALL'>('ALL');
  const [epicFilter, setEpicFilter] = useState<number | 'none' | 'all'>('all');
  const [search, setSearch] = useState('');
  const [epics, setEpics] = useState<EpicItem[]>([]);
  const [stories, setStories] = useState<UserStoryItem[]>([]);
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('backlog');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStory, setEditStory] = useState<UserStoryItem | null>(null);
  const [editEpic, setEditEpic] = useState<EpicItem | null>(null);
  const [detailStory, setDetailStory] = useState<UserStoryItem | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const canManage = Boolean(
    user && selectedProject && (user.role === 'ROLE_ADMIN' || selectedProject.owner),
  );

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
      setSelectedProjectId((current) => current || data[0]?.id || '');
    } catch {
      setError('Impossible de charger les projets.');
    }
  }, []);

  const loadBacklog = useCallback(async () => {
    if (!selectedProjectId) {
      setStories([]);
      setEpics([]);
      setSprints([]);
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [backlog, sprintRows, taskRows] = await Promise.all([
        fetchBacklogByProject(selectedProjectId, priority),
        fetchSprintsByProject(selectedProjectId),
        fetchTasksByProject(selectedProjectId),
      ]);
      setEpics(backlog.epics ?? []);
      setStories(backlog.stories);
      setSprints(sprintRows);
      setTasks(taskRows);
    } catch {
      setError('Impossible de charger le backlog.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, priority]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  const filteredStories = useMemo(() => {
    let list = stories;
    if (epicFilter === 'none') list = list.filter((s) => !s.epicId);
    else if (epicFilter !== 'all') list = list.filter((s) => s.epicId === epicFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q)
          || s.description?.toLowerCase().includes(q)
          || s.epicTitle?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [stories, epicFilter, search]);

  const handleSaveStory = async (payload: CreateUserStoryPayload) => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      if (editStory) {
        await updateUserStory(editStory.id, payload);
        setSnack({ msg: 'Story mise a jour.', sev: 'success' });
      } else {
        await createUserStory(selectedProjectId, payload);
        setSnack({ msg: 'Story creee.', sev: 'success' });
      }
      setStoryDialogOpen(false);
      setEditStory(null);
      await loadBacklog();
    } catch (errorValue: unknown) {
      const message = errorValue && typeof errorValue === 'object' && 'response' in errorValue
        ? (errorValue as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: message ?? 'Operation impossible.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEpic = async (payload: CreateEpicPayload) => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      if (editEpic) {
        await updateEpic(editEpic.id, payload);
        setSnack({ msg: 'Epic mis a jour.', sev: 'success' });
      } else {
        await createEpic(selectedProjectId, payload);
        setSnack({ msg: 'Epic cree.', sev: 'success' });
      }
      setEpicDialogOpen(false);
      setEditEpic(null);
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Operation epic impossible.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEpic = async (epic: EpicItem) => {
    if (!window.confirm(`Supprimer l'epic « ${epic.title} » ? Les stories seront conservees sans epic.`)) return;
    try {
      await deleteEpic(epic.id);
      setSnack({ msg: 'Epic supprime.', sev: 'success' });
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Suppression epic impossible.', sev: 'error' });
    }
  };

  const handleEpicStatusChange = async (epic: EpicItem, status: EpicStatus) => {
    try {
      await updateEpic(epic.id, {
        title: epic.title,
        description: epic.description ?? undefined,
        status,
        color: epic.color,
        startDate: epic.startDate,
        endDate: epic.endDate,
      });
      setSnack({ msg: 'Statut epic mis a jour.', sev: 'success' });
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Mise a jour statut impossible.', sev: 'error' });
    }
  };

  const handleDeleteStory = async (story: UserStoryItem) => {
    if (!window.confirm(`Supprimer la story « ${story.title} » ?`)) return;
    try {
      await deleteUserStory(story.id);
      setSnack({ msg: 'Story supprimee.', sev: 'success' });
      setDetailStory(null);
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Suppression impossible.', sev: 'error' });
    }
  };

  const handleMoveStory = async (storyId: number, sprintId: number | null) => {
    try {
      if (sprintId) {
        await assignStoryToSprint(storyId, sprintId);
      } else {
        await removeStoryFromSprint(storyId);
      }
      setSnack({ msg: 'Planification mise a jour.', sev: 'success' });
      await loadBacklog();
    } catch (errorValue: unknown) {
      const message = errorValue && typeof errorValue === 'object' && 'response' in errorValue
        ? (errorValue as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: message ?? 'Deplacement impossible.', sev: 'error' });
    }
  };

  const openStoryDetail = (story: UserStoryItem) => setDetailStory(story);

  const filtersRow = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="backlog-epic-filter">Epic</InputLabel>
        <Select
          labelId="backlog-epic-filter"
          label="Epic"
          value={epicFilter === 'all' ? 'all' : epicFilter === 'none' ? 'none' : epicFilter}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'all' || v === 'none') setEpicFilter(v);
            else setEpicFilter(Number(v));
          }}
        >
          <MenuItem value="all">Tous les epics</MenuItem>
          <MenuItem value="none">Sans epic</MenuItem>
          {epics.map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}
        </Select>
      </FormControl>
      <TextField
        size="small"
        placeholder="Rechercher une story..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ minWidth: 220 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
          ),
        }}
      />
    </Stack>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Planification Agile</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Epic → Story → Tache · Backlog hierarchique, planification sprint et calendrier.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="backlog-plan-project-label">Projet</InputLabel>
            <Select labelId="backlog-plan-project-label" label="Projet" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value as number)}>
              {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="backlog-plan-priority-label">Priorite</InputLabel>
            <Select labelId="backlog-plan-priority-label" label="Priorite" value={priority} onChange={(e) => setPriority(e.target.value as StoryPriority | 'ALL')}>
              <MenuItem value="ALL">Toutes</MenuItem>
              <MenuItem value="LOW">Faible</MenuItem>
              <MenuItem value="MEDIUM">Moyenne</MenuItem>
              <MenuItem value="HIGH">Haute</MenuItem>
              <MenuItem value="CRITICAL">Critique</MenuItem>
            </Select>
          </FormControl>
          {canManage && (
            <>
              <Button variant="outlined" startIcon={<Layers />} disabled={!selectedProjectId} onClick={() => { setEditEpic(null); setEpicDialogOpen(true); }}>
                Epic
              </Button>
              <Button variant="contained" startIcon={<Add />} disabled={!selectedProjectId} onClick={() => { setEditStory(null); setStoryDialogOpen(true); }}>
                Story
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="backlog" label="Backlog" icon={<Layers />} iconPosition="start" />
        <Tab value="epics" label="Epics" icon={<Dashboard />} iconPosition="start" />
        <Tab value="planning" label="Sprints" icon={<ViewColumn />} iconPosition="start" />
        <Tab value="calendar" label="Calendrier" icon={<CalendarMonth />} iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : !selectedProjectId ? (
        <Alert severity="info">Selectionnez un projet pour commencer.</Alert>
      ) : (
        <>
          <PlanningOverview epics={epics} stories={stories} />
          {filtersRow}

          {tab === 'backlog' && (
            stories.length === 0 && epics.length === 0 ? (
              <Alert severity="info">
                Creez un epic puis des user stories. Decomposez ensuite en taches depuis le Kanban.
              </Alert>
            ) : filteredStories.length === 0 ? (
              <Alert severity="info">Aucune story ne correspond aux filtres.</Alert>
            ) : (
              <BacklogEpicView
                epics={epics}
                stories={filteredStories}
                canManage={canManage}
                onEditEpic={(e) => { setEditEpic(e); setEpicDialogOpen(true); }}
                onDeleteEpic={handleDeleteEpic}
                onEdit={(s) => { setEditStory(s); setStoryDialogOpen(true); }}
                onDelete={handleDeleteStory}
                onRemoveFromSprint={(s) => handleMoveStory(s.id, null)}
                onOpenStory={openStoryDetail}
              />
            )
          )}

          {tab === 'epics' && (
            epics.length === 0 ? (
              <Alert severity="info">Creez votre premier epic pour structurer le backlog.</Alert>
            ) : (
              <EpicStatusBoard
                epics={epics}
                canManage={canManage}
                onEdit={(e) => { setEditEpic(e); setEpicDialogOpen(true); }}
                onDelete={handleDeleteEpic}
                onStatusChange={handleEpicStatusChange}
              />
            )
          )}

          {tab === 'planning' && (
            sprints.length === 0 ? (
              <Alert severity="info">
                Creez des sprints depuis la page Sprints, puis glissez les stories ici.
              </Alert>
            ) : (
              <SprintPlanningBoard
                stories={stories}
                sprints={sprints}
                epicFilter={epicFilter}
                disabled={!canManage}
                onMoveStory={handleMoveStory}
                onOpenStory={openStoryDetail}
              />
            )
          )}

          {tab === 'calendar' && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                <IconButton onClick={() => setCalendarMonth((m) => subMonths(m, 1))}><ChevronLeft /></IconButton>
                <IconButton onClick={() => setCalendarMonth((m) => addMonths(m, 1))}><ChevronRight /></IconButton>
              </Stack>
              <PlanningCalendar month={calendarMonth} sprints={sprints} epics={epics} stories={stories} tasks={tasks} />
            </Box>
          )}
        </>
      )}

      <CreateStoryModal
        open={storyDialogOpen}
        saving={saving}
        story={editStory}
        epics={epics}
        onClose={() => { setStoryDialogOpen(false); setEditStory(null); }}
        onSubmit={handleSaveStory}
      />

      <CreateEpicModal
        open={epicDialogOpen}
        saving={saving}
        epic={editEpic}
        onClose={() => { setEpicDialogOpen(false); setEditEpic(null); }}
        onSubmit={handleSaveEpic}
      />

      <StoryDetailDrawer
        story={detailStory}
        open={detailStory != null}
        canManage={canManage}
        onClose={() => setDetailStory(null)}
        onEdit={(s) => { setDetailStory(null); setEditStory(s); setStoryDialogOpen(true); }}
        onDelete={handleDeleteStory}
        onRemoveFromSprint={(s) => handleMoveStory(s.id, null)}
      />

      <Snackbar open={snack != null} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack?.msg} />
    </Box>
  );
};

export default BacklogPage;
