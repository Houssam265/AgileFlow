import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { UserStoryItem } from '../../types';
import StoryPriorityBadge from './StoryPriorityBadge';
import { storyTaskProgress } from '../../utils/storyProgress';
import { formatDate } from '../../utils/formatDate';

type Props = {
  story: UserStoryItem | null;
  open: boolean;
  canManage: boolean;
  onClose: () => void;
  onEdit: (story: UserStoryItem) => void;
  onDelete: (story: UserStoryItem) => void;
  onRemoveFromSprint: (story: UserStoryItem) => void;
};

const StoryDetailDrawer = ({
  story,
  open,
  canManage,
  onClose,
  onEdit,
  onDelete,
  onRemoveFromSprint,
}: Props) => {
  const navigate = useNavigate();

  if (!story) return null;

  const progress = storyTaskProgress(story);

  const goToKanban = () => {
    const params = new URLSearchParams();
    params.set('project', String(story.projectId));
    if (story.sprintId) params.set('sprint', String(story.sprintId));
    params.set('story', String(story.id));
    navigate(`/kanban?${params.toString()}`);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography variant="h6" fontWeight={700}>{story.title}</Typography>
          <StoryPriorityBadge priority={story.priority} />
        </Stack>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {story.epicTitle && (
            <Chip size="small" label={story.epicTitle} sx={{ bgcolor: story.epicColor ?? 'grey.500', color: '#fff' }} />
          )}
          <Chip size="small" variant="outlined" label={story.sprintLabel ?? 'Backlog produit'} />
          {story.storyPoints != null && <Chip size="small" variant="outlined" label={`${story.storyPoints} pts`} />}
          {story.done && <Chip size="small" color="success" label="Terminee" />}
        </Stack>

        {story.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {story.description}
          </Typography>
        )}

        {story.acceptanceCriteria && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700}>Criteres d'acceptation</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{story.acceptanceCriteria}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700}>Progression taches</Typography>
        <Typography variant="caption" color="text.secondary">
          {story.completedTaskCount}/{story.taskCount} terminees ({progress}%)
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 8, borderRadius: 2 }} />

        {story.createdAt && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Creee le {formatDate(story.createdAt)}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mt: 3 }}>
          <Button variant="outlined" startIcon={<OpenInNew />} onClick={goToKanban}>
            Voir les taches (Kanban)
          </Button>
          {canManage && (
            <>
              <Button variant="outlined" onClick={() => onEdit(story)}>Modifier la story</Button>
              {story.sprintId != null && (
                <Button onClick={() => onRemoveFromSprint(story)}>Retirer du sprint</Button>
              )}
              <Button color="error" onClick={() => onDelete(story)}>Supprimer</Button>
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

export default StoryDetailDrawer;
