import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { CreateEpicPayload, EpicItem, EpicStatus } from '../../types';

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

type Props = {
  open: boolean;
  saving: boolean;
  epic?: EpicItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateEpicPayload) => Promise<void>;
};

const CreateEpicModal = ({ open, saving, epic, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<CreateEpicPayload>({
    title: '',
    description: '',
    status: 'TODO',
    color: COLORS[0],
  });

  useEffect(() => {
    if (open) {
      setForm(epic ? {
        title: epic.title,
        description: epic.description ?? '',
        status: epic.status,
        color: epic.color,
        startDate: epic.startDate,
        endDate: epic.endDate,
      } : { title: '', description: '', status: 'TODO', color: COLORS[0] });
    }
  }, [open, epic]);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{epic ? 'Modifier l\'epic' : 'Nouvel epic'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Titre de l'epic"
            value={form.title}
            onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Objectif"
            value={form.description ?? ''}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            multiline
            minRows={2}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              label="Statut"
              value={form.status ?? 'TODO'}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as EpicStatus }))}
            >
              <MenuItem value="TODO">A faire</MenuItem>
              <MenuItem value="IN_PROGRESS">En cours</MenuItem>
              <MenuItem value="REVIEW">En revue</MenuItem>
              <MenuItem value="DONE">Termine</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Couleur</InputLabel>
            <Select
              label="Couleur"
              value={form.color ?? COLORS[0]}
              onChange={(e) => setForm((c) => ({ ...c, color: e.target.value }))}
            >
              {COLORS.map((color) => (
                <MenuItem key={color} value={color}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: color, display: 'inline-block' }} />
                    {color}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Debut"
              type="date"
              value={form.startDate ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, startDate: e.target.value || null }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fin"
              type="date"
              value={form.endDate ?? ''}
              onChange={(e) => setForm((c) => ({ ...c, endDate: e.target.value || null }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button variant="contained" disabled={saving || !form.title.trim()} onClick={() => onSubmit(form)}>
          {epic ? 'Enregistrer' : 'Creer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEpicModal;
