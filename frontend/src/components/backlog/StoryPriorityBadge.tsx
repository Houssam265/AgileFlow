import { Chip } from '@mui/material';
import type { StoryPriority } from '../../types';

const priorityColor: Record<StoryPriority, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'success',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const priorityLabel: Record<StoryPriority, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

const StoryPriorityBadge = ({ priority }: { priority: StoryPriority }) => (
  <Chip size="small" color={priorityColor[priority]} label={priorityLabel[priority]} />
);

export default StoryPriorityBadge;
