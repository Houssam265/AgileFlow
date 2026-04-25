import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Grid,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import type { SprintItem, SprintPayload } from '../../api/sprintsApi';
import { addStoryToSprint, removeStoryFromSprint } from '../../api/sprintsApi';
import { fetchBacklogByProject } from '../../api/backlogApi';
import type { UserStoryItem } from '../../types';
import UserStoryCard from '../backlog/UserStoryCard';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: SprintPayload, existing?: SprintItem | null) => Promise<void>;
  projetId: number;
  initialSprint?: SprintItem | null;
};

const SprintPlanningModal = ({ open, onClose, onSave, projetId, initialSprint }: Props) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [capacitePoints, setCapacitePoints] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [loadingStories, setLoadingStories] = useState(false);
  const [stories, setStories] = useState<UserStoryItem[]>([]);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const loadStories = async () => {
    if (!projetId) return;
    setLoadingStories(true);
    try {
      const data = await fetchBacklogByProject(projetId);
      setStories(data.stories || []);
    } catch {
      setSnack({ msg: 'Impossible de charger les stories', sev: 'error' });
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    if (initialSprint) {
      setNom(initialSprint.nom);
      setDescription(initialSprint.description ?? '');
      setDateDebut(initialSprint.dateDebut ?? '');
      setDateFin(initialSprint.dateFin ?? '');
      setCapacitePoints(initialSprint.capacitePoints != null ? String(initialSprint.capacitePoints) : '');
      loadStories();
    } else {
      setNom('');
      setDescription('');
      setDateDebut('');
      setDateFin('');
      setCapacitePoints('');
      setStories([]);
    }
  }, [initialSprint, open]);

  const handleSave = async () => {
    if (!nom.trim() || !dateDebut) {
      return;
    }
    const payload: SprintPayload = {
      nom: nom.trim(),
      description: description.trim() || null,
      dateDebut,
      dateFin: dateFin || null,
      capacitePoints: capacitePoints ? Number(capacitePoints) : null,
      projetId,
    };
    setSaving(true);
    try {
      await onSave(payload, initialSprint ?? null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddStory = async (story: UserStoryItem) => {
    if (!initialSprint) return;
    if (initialSprint.statut === 'TERMINE') {
      setSnack({ msg: 'Un sprint termine ne peut plus recevoir de stories.', sev: 'error' });
      return;
    }

    const storyPts = story.storyPoints || 0;
    const maxPts = initialSprint.capacitePoints || 0;
    const currentPts = sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);

    if (maxPts > 0 && currentPts + storyPts > maxPts) {
      setSnack({ msg: `La capacite du sprint (${maxPts} pts) est depassee.`, sev: 'error' });
      return;
    }

    try {
      await addStoryToSprint(initialSprint.id, story.id);
      await loadStories();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Erreur lors de l\'ajout au sprint.', sev: 'error' });
    }
  };

  const handleRemoveStory = async (story: UserStoryItem) => {
    if (!initialSprint) return;
    if (initialSprint.statut === 'TERMINE') {
      setSnack({ msg: 'On ne peut pas retirer de story d\'un sprint termine.', sev: 'error' });
      return;
    }

    try {
      await removeStoryFromSprint(initialSprint.id, story.id);
      await loadStories();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setSnack({ msg: msg ?? 'Erreur lors du retrait du sprint.', sev: 'error' });
    }
  };

  const sprintStories = stories.filter(s => s.sprintId === initialSprint?.id);
  const backlogStories = stories.filter(s => s.sprintId == null);
  const totalPoints = sprintStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{initialSprint ? 'Modifier le sprint' : 'Nouveau sprint'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nom du sprint"
            fullWidth
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <TextField
            label="Description / objectif"
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Date de debut"
              type="date"
              fullWidth
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date de fin"
              type="date"
              fullWidth
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <TextField
            label="Capacite (points)"
            type="number"
            fullWidth
            value={capacitePoints}
            onChange={(e) => setCapacitePoints(e.target.value)}
          />
        </Stack>

        {initialSprint && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Gestion des User Stories
            </Typography>
            <Typography variant="body2" mb={2}>
              Points utilises: {totalPoints} / {initialSprint.capacitePoints || '∞'}
            </Typography>

            {loadingStories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>Backlog (disponibles)</Typography>
                    {backlogStories.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">Aucune story disponible</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {backlogStories.map(story => (
                          <Box key={story.id} sx={{ cursor: 'pointer' }} onClick={() => handleAddStory(story)}>
                            <UserStoryCard story={story} canManage={false} />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>Dans ce sprint</Typography>
                    {sprintStories.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">Aucune story dans ce sprint</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {sprintStories.map(story => (
                          <Box key={story.id} sx={{ cursor: 'pointer' }} onClick={() => handleRemoveStory(story)}>
                            <UserStoryCard story={story} canManage={false} />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !nom.trim() || !dateDebut}>
          Enregistrer
        </Button>
      </DialogActions>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack ? <Alert severity={snack.sev} onClose={() => setSnack(null)} sx={{ width: '100%' }}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </Dialog>
  );
};

export default SprintPlanningModal;
