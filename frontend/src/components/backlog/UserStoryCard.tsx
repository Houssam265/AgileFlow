import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { UserStoryItem } from '../../types';
import StoryPriorityBadge from './StoryPriorityBadge';
import { formatDate } from '../../utils/formatDate';
import { storyTaskProgress } from '../../utils/storyProgress';

type Props = {
  story: UserStoryItem;
  canManage: boolean;
  compact?: boolean;
  onOpen?: (story: UserStoryItem) => void;
  onEdit?: (story: UserStoryItem) => void;
  onDelete?: (story: UserStoryItem) => void;
  onRemoveFromSprint?: (story: UserStoryItem) => void;
};

const UserStoryCard = ({ story, canManage, compact, onOpen, onEdit, onDelete, onRemoveFromSprint }: Props) => {
  const progress = storyTaskProgress(story);

  const content = (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          {story.done && <CheckCircle color="success" fontSize="small" />}
          <Typography variant={compact ? 'body2' : 'h6'} fontWeight={700} noWrap>
            {story.title}
          </Typography>
        </Stack>
        <StoryPriorityBadge priority={story.priority} />
      </Stack>
      {!compact && story.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {story.description}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {story.epicTitle && (
          <Chip size="small" label={story.epicTitle} sx={{ bgcolor: story.epicColor ?? 'grey.500', color: '#fff' }} />
        )}
        {story.storyPoints != null && <Chip size="small" variant="outlined" label={`${story.storyPoints} pts`} />}
        <Chip size="small" variant="outlined" label={story.sprintLabel || 'Backlog'} />
        {story.taskCount > 0 && (
          <Chip size="small" variant="outlined" label={`${story.completedTaskCount}/${story.taskCount} taches`} />
        )}
      </Stack>
      {story.taskCount > 0 && (
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, height: 4, borderRadius: 2 }} />
      )}
      {!compact && story.acceptanceCriteria && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Critere: {story.acceptanceCriteria}
        </Typography>
      )}
      {!compact && story.createdAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Creee le {formatDate(story.createdAt)}
        </Typography>
      )}
      {canManage && !compact && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); onEdit?.(story); }}>Modifier</Button>
          <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(story); }}>Supprimer</Button>
          {story.sprintId != null && (
            <Button size="small" onClick={(e) => { e.stopPropagation(); onRemoveFromSprint?.(story); }}>Retirer du sprint</Button>
          )}
        </Stack>
      )}
    </>
  );

  if (onOpen) {
    return (
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: story.done ? 'success.light' : 'divider',
          borderRadius: 2,
          borderLeft: 4,
          borderLeftColor: story.epicColor ?? 'divider',
        }}
      >
        <CardActionArea onClick={() => onOpen(story)}>
          <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
            {content}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        borderLeft: 4,
        borderLeftColor: story.epicColor ?? 'divider',
      }}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        {content}
      </CardContent>
    </Card>
  );
};

export default UserStoryCard;
