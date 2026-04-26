import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Badge } from '@mui/material';
import TaskCard from './TaskCard';
import type { TaskItem, TaskStatut } from '../../types';

interface KanbanColumnProps {
  id: TaskStatut;
  title: string;
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
}

const KanbanColumn = ({ id, title, tasks, onTaskClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'Column', statut: id },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 320,
        minWidth: 320,
        bgcolor: isOver ? 'grey.200' : 'grey.100',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        transition: 'background-color 0.2s',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'grey.300' }}>
        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
          {title}
        </Typography>
        <Badge badgeContent={tasks.length} color="primary" sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', ml: 1 } }} />
      </Box>

      <Box
        sx={{
          p: 1.5,
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 150,
        }}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
      </Box>
    </Box>
  );
};

export default KanbanColumn;
