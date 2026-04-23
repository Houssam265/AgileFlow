import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { fetchProjects } from '../../api/projectsApi';
import type { ProjectListItem } from '../../types';
import {
  createSprint,
  deleteSprint,
  fetchSprintsByProject,
  finishSprint,
  startSprint,
  updateSprint,
  type SprintItem,
  type SprintPayload,
} from '../../api/sprintsApi';
import SprintCard from '../../components/sprints/SprintCard';
import SprintPlanningModal from '../../components/sprints/SprintPlanningModal';

const SprintsPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [sprints, setSprints] = useState<SprintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const [planningOpen, setPlanningOpen] = useState(false);
  const [editSprint, setEditSprint] = useState<SprintItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SprintItem | null>(null);

  const loadProjects = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch {
      setError('Impossible de charger les projets.');
    }
  }, [selectedProjectId]);

  const loadSprints = useCallback(async () => {
    if (!selectedProjectId) {
      setSprints([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSprintsByProject(selectedProjectId);
      setSprints(data);
    } catch {
      setError('Impossible de charger les sprints.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  const handleOpenNew = () => {
    if (!selectedProjectId) return;
    setEditSprint(null);
    setPlanningOpen(true);
  };

  const handleEdit = (s: SprintItem) => {
    setEditSprint(s);
    setPlanningOpen(true);
  };

  const handleSave = async (payload: SprintPayload, existing?: SprintItem | null) => {
    try {
      if (existing) {
        await updateSprint(existing.id, payload);
        setSnack({ msg: 'Sprint mis a jour.', sev: 'success' });
      } else {
        await createSprint(payload);
        setSnack({ msg: 'Sprint cree.', sev: 'success' });
      }
      loadSprints();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Operation impossible.', sev: 'error' });
    }
  };

  const handleStart = async (s: SprintItem) => {
    try {
      await startSprint(s.id);
      setSnack({ msg: 'Sprint demarre.', sev: 'success' });
      loadSprints();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Impossible de demarrer le sprint.', sev: 'error' });
    }
  };

  const handleFinish = async (s: SprintItem) => {
    try {
      await finishSprint(s.id);
      setSnack({ msg: 'Sprint termine.', sev: 'success' });
      loadSprints();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Impossible de terminer le sprint.', sev: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSprint(confirmDelete.id);
      setSnack({ msg: 'Sprint supprime.', sev: 'success' });
      setConfirmDelete(null);
      loadSprints();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Suppression impossible.', sev: 'error' });
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Sprints
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="project-select-label">Projet</InputLabel>
            <Select
              labelId="project-select-label"
              label="Projet"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value as number)}
            >
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {canManage && (
            <Button
              variant="contained"
              startIcon={<Add />}
              disabled={!selectedProjectId}
              onClick={handleOpenNew}
            >
              Nouveau sprint
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !selectedProject ? (
        <Alert severity="info">Aucun projet disponible.</Alert>
      ) : sprints.length === 0 ? (
        <Alert severity="info">Aucun sprint pour ce projet.</Alert>
      ) : (
        <Grid container spacing={2}>
          {sprints.map((s) => (
            <Grid item xs={12} md={6} lg={4} key={s.id}>
              <SprintCard
                sprint={s}
                onClick={canManage ? () => handleEdit(s) : undefined}
                onStart={canManage && s.statut === 'PLANIFIE' ? () => handleStart(s) : undefined}
                onFinish={canManage && s.statut === 'EN_COURS' ? () => handleFinish(s) : undefined}
                onDelete={canManage && s.statut === 'PLANIFIE' ? () => setConfirmDelete(s) : undefined}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {canManage && selectedProjectId && (
        <SprintPlanningModal
          open={planningOpen}
          onClose={() => setPlanningOpen(false)}
          onSave={handleSave}
          projetId={selectedProjectId as number}
          initialSprint={editSprint}
        />
      )}

      <Dialog
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Supprimer le sprint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Supprimer le sprint « {confirmDelete?.nom} » ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack != null}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.msg}
      />
    </Box>
  );
};

export default SprintsPage;
