import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SprintItem } from '../../api/sprintsApi';

type Props = {
  sprints: SprintItem[];
  disabled?: boolean;
  onDropStory: (storyId: number, sprintId: number) => void;
};

const DragToSprint = ({ sprints, disabled = false, onDropStory }: Props) => (
  <Stack spacing={1.5}>
    {sprints.map((sprint) => (
      <Paper
        key={sprint.id}
        variant="outlined"
        onDragOver={(event) => {
          if (!disabled) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          const storyId = Number(event.dataTransfer.getData('text/plain'));
          if (Number.isFinite(storyId) && storyId > 0) {
            onDropStory(storyId, sprint.id);
          }
        }}
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: disabled ? 'grey.100' : 'background.paper',
          borderStyle: 'dashed',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>{sprint.nom}</Typography>
        <Typography variant="body2" color="text.secondary">
          {sprint.description || 'Aucun objectif defini.'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Glissez une user story ici pour l'affecter a ce sprint.
          </Typography>
        </Box>
      </Paper>
    ))}
  </Stack>
);

export default DragToSprint;
