import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { SprintItem } from '../../api/sprintsApi';
import type { UserStoryItem } from '../../types';
import StoryPriorityBadge from './StoryPriorityBadge';
import { SPRINT_STATUS_COLOR, SPRINT_STATUS_LABEL } from '../../utils/planningConstants';

const BACKLOG_COLUMN = 'backlog';
const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

type Column = {
  id: string;
  sprintId: number | null;
  title: string;
  subtitle?: string;
  status?: string;
  capacity?: number | null;
};

type Props = {
  stories: UserStoryItem[];
  sprints: SprintItem[];
  disabled?: boolean;
  epicFilter?: number | 'none' | 'all';
  onMoveStory: (storyId: number, sprintId: number | null) => void;
  onOpenStory?: (story: UserStoryItem) => void;
};

const sortStories = (items: UserStoryItem[]) =>
  [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.id - b.id;
  });

const DraggableStory = ({
  story,
  disabled,
  onOpen,
}: {
  story: UserStoryItem;
  disabled?: boolean;
  onOpen?: (story: UserStoryItem) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `story-${story.id}`,
    data: { story, type: 'story' },
    disabled,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      onClick={() => onOpen?.(story)}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.5,
        borderRadius: 2,
        cursor: disabled ? 'pointer' : 'grab',
        borderLeft: 4,
        borderLeftColor: story.epicColor ?? 'primary.main',
        bgcolor: story.done ? 'success.50' : 'background.paper',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Typography variant="body2" fontWeight={700}>{story.title}</Typography>
        <StoryPriorityBadge priority={story.priority} />
      </Stack>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {story.epicTitle && <Chip size="small" label={story.epicTitle} sx={{ bgcolor: story.epicColor, color: '#fff', height: 20 }} />}
        {story.storyPoints != null && <Chip size="small" variant="outlined" label={`${story.storyPoints} pts`} />}
        {story.taskCount > 0 && (
          <Chip size="small" variant="outlined" label={`${story.completedTaskCount}/${story.taskCount}`} />
        )}
        {story.done && <Chip size="small" color="success" label="OK" />}
      </Stack>
    </Paper>
  );
};

const PlanningColumn = ({
  column,
  stories,
  disabled,
  onOpenStory,
}: {
  column: Column;
  stories: UserStoryItem[];
  disabled?: boolean;
  onOpenStory?: (story: UserStoryItem) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { column } });
  const points = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const capacity = column.capacity ?? 0;
  const capacityPct = capacity > 0 ? Math.min(100, Math.round((points / capacity) * 100)) : 0;
  const overCapacity = capacity > 0 && points > capacity;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flex: '0 0 auto',
        bgcolor: isOver ? 'primary.50' : 'grey.50',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 300px)',
        transition: 'background-color 0.2s',
        border: '2px solid',
        borderColor: isOver ? 'primary.light' : overCapacity ? 'warning.main' : 'divider',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700}>{column.title}</Typography>
        {column.subtitle && (
          <Typography variant="caption" color="text.secondary">{column.subtitle}</Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${stories.length} stories`} />
          <Chip size="small" variant="outlined" label={`${points} pts`} />
          {column.status && (
            <Chip
              size="small"
              color={SPRINT_STATUS_COLOR[column.status] ?? 'default'}
              variant="outlined"
              label={SPRINT_STATUS_LABEL[column.status] ?? column.status}
            />
          )}
        </Stack>
        {capacity > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color={overCapacity ? 'warning.main' : 'text.secondary'}>
              Capacite {points}/{capacity} pts
            </Typography>
            <LinearProgress
              variant="determinate"
              value={capacityPct}
              color={overCapacity ? 'warning' : 'primary'}
              sx={{ mt: 0.5, height: 6, borderRadius: 2 }}
            />
          </Box>
        )}
      </Box>
      <Stack spacing={1} sx={{ p: 1.5, overflowY: 'auto', flexGrow: 1 }}>
        {sortStories(stories).map((story) => (
          <DraggableStory key={story.id} story={story} disabled={disabled} onOpen={onOpenStory} />
        ))}
      </Stack>
    </Box>
  );
};

const SprintPlanningBoard = ({ stories, sprints, disabled, epicFilter = 'all', onMoveStory, onOpenStory }: Props) => {
  const [activeStory, setActiveStory] = useState<UserStoryItem | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filteredStories = useMemo(() => {
    if (epicFilter === 'all') return stories;
    if (epicFilter === 'none') return stories.filter((s) => !s.epicId);
    return stories.filter((s) => s.epicId === epicFilter);
  }, [stories, epicFilter]);

  const columns: Column[] = useMemo(() => [
    { id: BACKLOG_COLUMN, sprintId: null, title: 'Backlog produit', subtitle: 'Stories non planifiees' },
    ...sprints.map((s) => ({
      id: `sprint-${s.id}`,
      sprintId: s.id,
      title: s.nom,
      subtitle: s.dateDebut && s.dateFin ? `${s.dateDebut} → ${s.dateFin}` : undefined,
      status: s.statut,
      capacity: s.capacitePoints,
    })),
  ], [sprints]);

  const storiesByColumn = useMemo(() => {
    const map = new Map<string, UserStoryItem[]>();
    columns.forEach((c) => map.set(c.id, []));
    filteredStories.forEach((story) => {
      const colId = story.sprintId ? `sprint-${story.sprintId}` : BACKLOG_COLUMN;
      if (map.has(colId)) {
        map.get(colId)?.push(story);
      } else {
        map.get(BACKLOG_COLUMN)?.push(story);
      }
    });
    return map;
  }, [columns, filteredStories]);

  const resolveColumnId = (overId: string): string | null => {
    const column = columns.find((c) => c.id === overId);
    if (column) return column.id;
    if (overId.startsWith('story-')) {
      const storyId = Number(overId.replace('story-', ''));
      const story = filteredStories.find((s) => s.id === storyId);
      if (!story) return null;
      return story.sprintId ? `sprint-${story.sprintId}` : BACKLOG_COLUMN;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as UserStoryItem | undefined;
    setActiveStory(story ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveStory(null);
    const { active, over } = event;
    if (!over || disabled) return;
    const targetColumnId = resolveColumnId(String(over.id));
    if (!targetColumnId) return;
    const targetColumn = columns.find((c) => c.id === targetColumnId);
    if (!targetColumn) return;
    const storyId = Number(String(active.id).replace('story-', ''));
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;
    if (story.sprintId === targetColumn.sprintId) return;
    onMoveStory(storyId, targetColumn.sprintId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 420 }}>
        {columns.map((column) => (
          <PlanningColumn
            key={column.id}
            column={column}
            stories={storiesByColumn.get(column.id) ?? []}
            disabled={disabled}
            onOpenStory={onOpenStory}
          />
        ))}
      </Box>
      <DragOverlay>
        {activeStory ? <DraggableStory story={activeStory} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SprintPlanningBoard;
