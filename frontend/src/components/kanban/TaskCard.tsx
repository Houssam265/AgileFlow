import { useDraggable } from '@dnd-kit/core';
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import type { TaskItem } from '../../types';

interface TaskCardProps {
  task: TaskItem;
  onClick: (task: TaskItem) => void;
}

const PRIORITIES = {
  LOW: { label: 'Faible', color: 'info' },
  MEDIUM: { label: 'Moyenne', color: 'success' },
  HIGH: { label: 'Haute', color: 'warning' },
  CRITICAL: { label: 'Critique', color: 'error' },
} as const;

const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: task,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const priorityConfig = PRIORITIES[task.priorite] ?? PRIORITIES.MEDIUM;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(task)}
      sx={{
        mb: 2,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        borderLeft: `4px solid ${theme.palette[priorityConfig.color].main}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
        transition: 'box-shadow 0.2s',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
            {task.titre}
          </Typography>
          <Avatar
            sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}
            title={task.assignedToName || 'Non assigné'}
          >
            {task.assignedToName ? task.assignedToName.charAt(0).toUpperCase() : '?'}
          </Avatar>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={0.5} mb={1}>
          {task.labels?.map((label) => (
            <Chip key={label} label={label} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
          ))}
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
          <Chip
            label={priorityConfig.label}
            size="small"
            color={priorityConfig.color}
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
          />
          {task.dateEcheance && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14 }} />
              <Typography variant="caption" fontSize="0.7rem">
                {new Date(task.dateEcheance).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
