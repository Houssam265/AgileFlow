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
  Chip,
  Box,
} from '@mui/material';
import type { CreateTaskPayload, TaskPriorite, UserListItem } from '../../types';

type Props = {
  open: boolean;
  saving: boolean;
  users: UserListItem[];
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
};

const EMPTY_FORM: CreateTaskPayload = {
  titre: '',
  description: '',
  priorite: 'MEDIUM',
  assignedToId: null,
  dateEcheance: null,
  labels: [],
};

const CreateTaskModal = ({ open, saving, users, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<CreateTaskPayload>(EMPTY_FORM);
  const [labelInput, setLabelInput] = useState('');

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setLabelInput('');
    }
  }, [open]);

  const handleChange = <K extends keyof CreateTaskPayload>(key: K, value: CreateTaskPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault();
      const newLabel = labelInput.trim();
      if (!form.labels?.includes(newLabel)) {
        handleChange('labels', [...(form.labels || []), newLabel]);
      }
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    handleChange('labels', form.labels?.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = async () => {
    await onSubmit({
      ...form,
      description: form.description?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nouvelle tâche</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Titre"
            value={form.titre}
            onChange={(event) => handleChange('titre', event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={form.description ?? ''}
            onChange={(event) => handleChange('description', event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="task-priority-label">Priorité</InputLabel>
              <Select
                labelId="task-priority-label"
                label="Priorité"
                value={form.priorite}
                onChange={(event) => handleChange('priorite', event.target.value as TaskPriorite)}
              >
                <MenuItem value="LOW">Faible</MenuItem>
                <MenuItem value="MEDIUM">Moyenne</MenuItem>
                <MenuItem value="HIGH">Haute</MenuItem>
                <MenuItem value="CRITICAL">Critique</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="task-assignee-label">Assigné à</InputLabel>
              <Select
                labelId="task-assignee-label"
                label="Assigné à"
                value={form.assignedToId || ''}
                onChange={(event) => handleChange('assignedToId', event.target.value === '' ? null : Number(event.target.value))}
              >
                <MenuItem value=""><em>Non assigné</em></MenuItem>
                {users.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <TextField
            label="Date d'échéance"
            type="datetime-local"
            value={form.dateEcheance ?? ''}
            onChange={(event) => handleChange('dateEcheance', event.target.value || null)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <Box>
            <TextField
              label="Étiquettes (Appuyez sur Entrée)"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleAddLabel}
              fullWidth
              size="small"
            />
            <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
              {form.labels?.map(label => (
                <Chip key={label} label={label} onDelete={() => handleRemoveLabel(label)} />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving || !form.titre.trim()}>
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskModal;
