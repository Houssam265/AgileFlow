import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  assignStoryToSprint,
  createUserStory,
  deleteUserStory,
  fetchBacklogByProject,
  removeStoryFromSprint,
  updateUserStory,
} from '../../api/backlogApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchSprintsByProject, type SprintItem } from '../../api/sprintsApi';
import type { CreateUserStoryPayload, ProjectListItem, StoryPriority, UserStoryItem } from '../../types';
import CreateStoryModal from '../../components/backlog/CreateStoryModal';
import DragToSprint from '../../components/backlog/DragToSprint';
import UserStoryCard from '../../components/backlog/UserStoryCard';

const BacklogPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [priority, setPriority] = useState<StoryPriority | 'ALL'>('ALL');
  const [stories, setStories] = useState<UserStoryItem[]>([]);
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<UserStoryItem | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

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
      setSprints([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [backlog, sprintRows] = await Promise.all([
        fetchBacklogByProject(selectedProjectId, priority),
        fetchSprintsByProject(selectedProjectId),
      ]);
      setStories(backlog.stories);
      setSprints(sprintRows);
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

  const handleSave = async (payload: CreateUserStoryPayload) => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateUserStory(editTarget.id, payload);
        setSnack({ msg: 'User story mise a jour.', sev: 'success' });
      } else {
        await createUserStory(selectedProjectId, payload);
        setSnack({ msg: 'User story creee.', sev: 'success' });
      }
      setDialogOpen(false);
      setEditTarget(null);
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

  const handleDelete = async (story: UserStoryItem) => {
    try {
      await deleteUserStory(story.id);
      setSnack({ msg: 'User story supprimee.', sev: 'success' });
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Suppression impossible.', sev: 'error' });
    }
  };

  const handleAssignStory = async (storyId: number, sprintId: number) => {
    try {
      await assignStoryToSprint(storyId, sprintId);
      setSnack({ msg: 'Story ajoutee au sprint.', sev: 'success' });
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Affectation impossible.', sev: 'error' });
    }
  };

  const handleRemoveFromSprint = async (story: UserStoryItem) => {
    try {
      await removeStoryFromSprint(story.id);
      setSnack({ msg: 'Story retiree du sprint.', sev: 'success' });
      await loadBacklog();
    } catch {
      setSnack({ msg: 'Operation impossible.', sev: 'error' });
    }
  };

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Backlog</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Priorisez les user stories et glissez-les vers les sprints du projet.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="backlog-project-label">Projet</InputLabel>
            <Select
              labelId="backlog-project-label"
              label="Projet"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value as number)}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="backlog-priority-label">Priorite</InputLabel>
            <Select
              labelId="backlog-priority-label"
              label="Priorite"
              value={priority}
              onChange={(event) => setPriority(event.target.value as StoryPriority | 'ALL')}
            >
              <MenuItem value="ALL">Toutes</MenuItem>
              <MenuItem value="LOW">Faible</MenuItem>
              <MenuItem value="MEDIUM">Moyenne</MenuItem>
              <MenuItem value="HIGH">Haute</MenuItem>
              <MenuItem value="CRITICAL">Critique</MenuItem>
            </Select>
          </FormControl>
          {canManage && (
            <Button variant="contained" startIcon={<Add />} disabled={!selectedProjectId} onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
              Nouvelle story
            </Button>
          )}
        </Box>
      </Box>

      {selectedProject && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Projet actif: {selectedProject.name}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : !selectedProjectId ? (
        <Alert severity="info">Aucun projet disponible.</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {stories.length === 0 ? (
              <Alert severity="info">Aucune user story pour ce filtre.</Alert>
            ) : (
              <Grid container spacing={2}>
                {stories.map((story) => (
                  <Grid item xs={12} md={6} key={story.id}>
                    <UserStoryCard
                      story={story}
                      canManage={canManage}
                      onEdit={(value) => { setEditTarget(value); setDialogOpen(true); }}
                      onDelete={handleDelete}
                      onRemoveFromSprint={handleRemoveFromSprint}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
          <Grid item xs={12} lg={4}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Drag to Sprint</Typography>
            {sprints.length === 0 ? (
              <Alert severity="info">Aucun sprint disponible pour ce projet.</Alert>
            ) : (
              <DragToSprint sprints={sprints} disabled={!canManage} onDropStory={handleAssignStory} />
            )}
          </Grid>
        </Grid>
      )}

      <CreateStoryModal
        open={dialogOpen}
        saving={saving}
        story={editTarget}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSubmit={handleSave}
      />

      <Snackbar
        open={snack != null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.msg}
      />
    </Box>
  );
};

export default BacklogPage;
