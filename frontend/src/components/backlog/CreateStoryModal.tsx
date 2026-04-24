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
import type { CreateUserStoryPayload, StoryPriority, UserStoryItem } from '../../types';

type Props = {
  open: boolean;
  saving: boolean;
  story?: UserStoryItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateUserStoryPayload) => Promise<void>;
};

const EMPTY_FORM: CreateUserStoryPayload = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  storyPoints: null,
  acceptanceCriteria: '',
};

const CreateStoryModal = ({ open, saving, story, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<CreateUserStoryPayload>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(story ? {
        title: story.title,
        description: story.description ?? '',
        priority: story.priority,
        storyPoints: story.storyPoints ?? null,
        acceptanceCriteria: story.acceptanceCriteria ?? '',
      } : EMPTY_FORM);
    }
  }, [open, story]);

  const handleChange = <K extends keyof CreateUserStoryPayload>(key: K, value: CreateUserStoryPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit({
      ...form,
      description: form.description?.trim() || undefined,
      acceptanceCriteria: form.acceptanceCriteria?.trim() || undefined,
      storyPoints: form.storyPoints ?? null,
    });
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{story ? 'Modifier la user story' : 'Nouvelle user story'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Titre"
            value={form.title}
            onChange={(event) => handleChange('title', event.target.value)}
            fullWidth
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
              <InputLabel id="story-priority-label">Priorite</InputLabel>
              <Select
                labelId="story-priority-label"
                label="Priorite"
                value={form.priority}
                onChange={(event) => handleChange('priority', event.target.value as StoryPriority)}
              >
                <MenuItem value="LOW">Faible</MenuItem>
                <MenuItem value="MEDIUM">Moyenne</MenuItem>
                <MenuItem value="HIGH">Haute</MenuItem>
                <MenuItem value="CRITICAL">Critique</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Story points"
              type="number"
              value={form.storyPoints ?? ''}
              onChange={(event) => handleChange('storyPoints', event.target.value === '' ? null : Number(event.target.value))}
              fullWidth
              inputProps={{ min: 1, max: 100 }}
            />
          </Stack>
          <TextField
            label="Criteres d'acceptation"
            value={form.acceptanceCriteria ?? ''}
            onChange={(event) => handleChange('acceptanceCriteria', event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving || !form.title.trim()}>
          {story ? 'Enregistrer' : 'Creer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStoryModal;
