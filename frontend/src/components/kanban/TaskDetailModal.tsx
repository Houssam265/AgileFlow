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
import type { TaskItem, TaskPriorite, UpdateTaskPayload, UserListItem } from '../../types';

type Props = {
  open: boolean;
  saving: boolean;
  task: TaskItem | null;
  users: UserListItem[];
  onClose: () => void;
  onSubmit: (taskId: number, payload: UpdateTaskPayload) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  canManage: boolean;
};

const TaskDetailModal = ({ open, saving, task, users, onClose, onSubmit, onDelete, canManage }: Props) => {
  const [form, setForm] = useState<UpdateTaskPayload | null>(null);
  const [labelInput, setLabelInput] = useState('');

  useEffect(() => {
    if (open && task) {
      setForm({
        titre: task.titre,
        description: task.description ?? '',
        priorite: task.priorite,
        assignedToId: task.assignedToId ?? null,
        dateEcheance: task.dateEcheance ?? null,
        labels: task.labels ?? [],
      });
      setLabelInput('');
    }
  }, [open, task]);

  if (!form || !task) return null;

  const handleChange = <K extends keyof UpdateTaskPayload>(key: K, value: UpdateTaskPayload[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : null);
  };

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && labelInput.trim() && canManage) {
      e.preventDefault();
      const newLabel = labelInput.trim();
      if (!form.labels?.includes(newLabel)) {
        handleChange('labels', [...(form.labels || []), newLabel]);
      }
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    if (!canManage) return;
    handleChange('labels', form.labels?.filter((l) => l !== labelToRemove));
  };

  const handleSubmit = async () => {
    await onSubmit(task.id, {
      ...form,
      description: form.description?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Détails de la tâche</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Titre"
            value={form.titre}
            onChange={(event) => handleChange('titre', event.target.value)}
            fullWidth
            required
            disabled={!canManage}
          />
          <TextField
            label="Description"
            value={form.description ?? ''}
            onChange={(event) => handleChange('description', event.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={!canManage}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth disabled={!canManage}>
              <InputLabel id="edit-task-priority-label">Priorité</InputLabel>
              <Select
                labelId="edit-task-priority-label"
                label="Priorité"
                value={form.priorite || 'MEDIUM'}
                onChange={(event) => handleChange('priorite', event.target.value as TaskPriorite)}
              >
                <MenuItem value="LOW">Faible</MenuItem>
                <MenuItem value="MEDIUM">Moyenne</MenuItem>
                <MenuItem value="HIGH">Haute</MenuItem>
                <MenuItem value="CRITICAL">Critique</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!canManage}>
              <InputLabel id="edit-task-assignee-label">Assigné à</InputLabel>
              <Select
                labelId="edit-task-assignee-label"
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
            type="date"
            value={form.dateEcheance ?? ''}
            onChange={(event) => handleChange('dateEcheance', event.target.value || null)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={!canManage}
          />

          <Box>
            {canManage && (
              <TextField
                label="Étiquettes (Appuyez sur Entrée)"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleAddLabel}
                fullWidth
                size="small"
              />
            )}
            <Stack direction="row" flexWrap="wrap" gap={1} mt={canManage ? 1 : 0}>
              {form.labels?.map(label => (
                <Chip 
                  key={label} 
                  label={label} 
                  onDelete={canManage ? () => handleRemoveLabel(label) : undefined} 
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Box>
          {canManage && (
            <Button color="error" onClick={() => onDelete(task.id)} disabled={saving}>
              Supprimer
            </Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose} disabled={saving}>Annuler</Button>
          {canManage && (
            <Button onClick={handleSubmit} variant="contained" disabled={saving || !form.titre.trim()}>
              Enregistrer
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;
