import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { Add, GroupAdd } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { createProject, deleteProject, fetchProjects, updateProject } from '../../api/projectsApi';
import { fetchTeams } from '../../api/teamsApi';
import type { CreateProjectPayload, ProjectListItem, TeamListItem } from '../../types';
import CreateProjectModal from '../../components/projects/CreateProjectModal';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectInviteModal from '../../components/projects/ProjectInviteModal';
import ProjectReceivedInvitations from '../../components/projects/ProjectReceivedInvitations';

const ProjectsListPage = () => {
  const { user: current } = useAuth();

  const [rows, setRows] = useState<ProjectListItem[]>([]);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<ProjectListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, teamRows] = await Promise.all([fetchProjects(), fetchTeams()]);
      setRows(projects);
      setTeams(teamRows);
    } catch {
      setError('Impossible de charger les projets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((project) =>
      project.name.toLowerCase().includes(query)
      || (project.description ?? '').toLowerCase().includes(query)
      || (project.managerName ?? '').toLowerCase().includes(query));
  }, [rows, search]);

  const canEditProject = (project: ProjectListItem) =>
    current?.role === 'ROLE_ADMIN' || project.owner;

  const handleSave = async (payload: CreateProjectPayload) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateProject(editTarget.id, payload);
        setSnack({ msg: 'Projet mis a jour.', sev: 'success' });
      } else {
        await createProject(payload);
        setSnack({ msg: 'Projet cree. Vous en etes le proprietaire.', sev: 'success' });
      }
      setDialogOpen(false);
      setEditTarget(null);
      await load();
    } catch (errorValue: unknown) {
      const message = errorValue && typeof errorValue === 'object' && 'response' in errorValue
        ? (errorValue as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: message ?? 'Erreur lors de la sauvegarde.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      setSnack({ msg: 'Projet supprime.', sev: 'success' });
      setDeleteTarget(null);
      await load();
    } catch (errorValue: unknown) {
      const message = errorValue && typeof errorValue === 'object' && 'response' in errorValue
        ? (errorValue as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: message ?? 'Suppression impossible.', sev: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Projets</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Creez un projet, devenez proprietaire et invitez votre equipe.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ minWidth: 280 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
            Nouveau projet
          </Button>
        </Box>
      </Box>

      <ProjectReceivedInvitations onAccepted={load} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">Aucun projet a afficher. Creez votre premier projet pour commencer.</Alert>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((project) => (
            <Grid item xs={12} md={6} xl={4} key={project.id}>
              <ProjectCard
                project={project}
                actions={(
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {canEditProject(project) && (
                      <>
                        <Button size="small" variant="outlined" startIcon={<GroupAdd />} onClick={() => setInviteTarget(project)}>
                          Membres
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => { setEditTarget(project); setDialogOpen(true); }}>
                          Modifier
                        </Button>
                        <Button size="small" color="error" onClick={() => setDeleteTarget(project)}>
                          Supprimer
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateProjectModal
        open={dialogOpen}
        saving={saving}
        teams={teams}
        project={editTarget}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSubmit={handleSave}
      />

      <ProjectInviteModal
        open={!!inviteTarget}
        project={inviteTarget}
        onClose={() => setInviteTarget(null)}
        onUpdated={load}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Supprimer ce projet ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action supprimera definitivement le projet {deleteTarget ? `"${deleteTarget.name}"` : ''}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Confirmer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
};

export default ProjectsListPage;
