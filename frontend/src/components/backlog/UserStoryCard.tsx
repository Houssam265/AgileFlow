import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { UserStoryItem } from '../../types';
import StoryPriorityBadge from './StoryPriorityBadge';
import { formatDate } from '../../utils/formatDate';

type Props = {
  story: UserStoryItem;
  canManage: boolean;
  onEdit?: (story: UserStoryItem) => void;
  onDelete?: (story: UserStoryItem) => void;
  onRemoveFromSprint?: (story: UserStoryItem) => void;
};

const UserStoryCard = ({ story, canManage, onEdit, onDelete, onRemoveFromSprint }: Props) => (
  <Card
    elevation={0}
    draggable={canManage}
    onDragStart={(event) => event.dataTransfer.setData('text/plain', String(story.id))}
    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}
  >
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{story.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {story.description || 'Aucune description.'}
          </Typography>
        </Box>
        <StoryPriorityBadge priority={story.priority} />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {story.storyPoints != null && <Chip size="small" variant="outlined" label={`${story.storyPoints} pts`} />}
        <Chip size="small" variant="outlined" label={story.sprintLabel || 'Non planifiee'} />
      </Stack>

      {story.acceptanceCriteria && (
        <Typography variant="body2" color="text.secondary">
          Critere: {story.acceptanceCriteria}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
        Creee le {formatDate(story.createdAt)}
      </Typography>

      {canManage && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" onClick={() => onEdit?.(story)}>Modifier</Button>
          <Button size="small" color="error" onClick={() => onDelete?.(story)}>Supprimer</Button>
          {story.sprintId != null && (
            <Button size="small" onClick={() => onRemoveFromSprint?.(story)}>Retirer du sprint</Button>
          )}
        </Stack>
      )}
    </CardContent>
  </Card>
);

export default UserStoryCard;
