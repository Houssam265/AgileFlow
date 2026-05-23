import { useMemo } from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SprintItem } from '../../api/sprintsApi';
import type { EpicItem, TaskItem, UserStoryItem } from '../../types';

type Props = {
  month: Date;
  sprints: SprintItem[];
  epics: EpicItem[];
  stories: UserStoryItem[];
  tasks: TaskItem[];
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const inRange = (day: Date, start: string, end: string) => {
  try {
    return isWithinInterval(day, { start: parseISO(start), end: parseISO(end) });
  } catch {
    return false;
  }
};

const PlanningCalendar = ({ month, sprints, epics, stories, tasks }: Props) => {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = addDays(startOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 6);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const sprintBars = useMemo(() => sprints.filter((s) => s.dateDebut && s.dateFin), [sprints]);

  const sprintById = useMemo(() => new Map(sprints.map((s) => [s.id, s])), [sprints]);

  const storiesByDay = useMemo(() => {
    const map = new Map<string, UserStoryItem[]>();
    stories.forEach((story) => {
      if (!story.sprintId) return;
      const sprint = sprintById.get(story.sprintId);
      if (!sprint?.dateDebut || !sprint.dateFin) return;
      days.forEach((day) => {
        if (!inRange(day, sprint.dateDebut!, sprint.dateFin!)) return;
        const key = format(day, 'yyyy-MM-dd');
        const list = map.get(key) ?? [];
        if (!list.some((s) => s.id === story.id)) {
          list.push(story);
          map.set(key, list);
        }
      });
    });
    return map;
  }, [days, sprintById, stories]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((task) => {
      if (!task.dateEcheance) return;
      const key = task.dateEcheance.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    });
    return map;
  }, [tasks]);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {format(month, 'MMMM yyyy', { locale: fr })}
      </Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>Sprints planifies</Typography>
        {sprintBars.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Definissez des dates sur vos sprints pour les voir ici.</Typography>
        ) : (
          sprintBars.map((sprint) => {
            const sprintStories = stories.filter((s) => s.sprintId === sprint.id);
            return (
              <Box
                key={sprint.id}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: sprint.statut === 'EN_COURS' ? 'success.50' : 'grey.100',
                  borderLeft: 4,
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="body2" fontWeight={700}>{sprint.nom}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {sprint.dateDebut} → {sprint.dateFin} · {sprintStories.length} stories
                </Typography>
              </Box>
            );
          })
        )}
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
        {WEEKDAYS.map((d) => (
          <Typography key={d} variant="caption" fontWeight={700} textAlign="center" color="text.secondary">
            {d}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];
          const dayStories = storiesByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const activeSprints = sprintBars.filter((s) => s.dateDebut && s.dateFin && inRange(day, s.dateDebut, s.dateFin));
          const activeEpics = epics.filter((e) => e.startDate && e.endDate && inRange(day, e.startDate, e.endDate));
          const isToday = isSameDay(day, new Date());

          return (
            <Box
              key={key}
              sx={{
                minHeight: 100,
                p: 0.75,
                borderRadius: 1,
                bgcolor: inMonth ? 'background.paper' : 'grey.50',
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'divider',
                opacity: inMonth ? 1 : 0.45,
              }}
            >
              <Typography variant="caption" fontWeight={isToday ? 700 : 400} color={isToday ? 'primary.main' : 'text.secondary'}>
                {format(day, 'd')}
              </Typography>
              {activeSprints.map((s) => (
                <Box key={s.id} sx={{ mt: 0.5, height: 4, borderRadius: 1, bgcolor: 'primary.main' }} title={s.nom} />
              ))}
              {activeEpics.slice(0, 1).map((e) => (
                <Box key={e.id} sx={{ mt: 0.5, height: 3, borderRadius: 1, bgcolor: e.color }} title={e.title} />
              ))}
              <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                {dayStories.slice(0, 2).map((story) => (
                  <Tooltip key={story.id} title={`Story · ${story.sprintLabel ?? 'Sprint'}`}>
                    <Chip
                      size="small"
                      label={story.title}
                      sx={{
                        height: 18,
                        fontSize: 10,
                        maxWidth: '100%',
                        bgcolor: story.epicColor ?? 'secondary.light',
                        color: story.epicColor ? '#fff' : undefined,
                      }}
                    />
                  </Tooltip>
                ))}
                {dayTasks.slice(0, 2).map((t) => (
                  <Tooltip key={t.id} title={`Tache · echeance`}>
                    <Chip size="small" label={t.titre} color="warning" variant="outlined" sx={{ height: 18, fontSize: 10, maxWidth: '100%' }} />
                  </Tooltip>
                ))}
                {(dayStories.length + dayTasks.length) > 4 && (
                  <Typography variant="caption">+{dayStories.length + dayTasks.length - 4}</Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Sprint</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, bgcolor: '#6366F1', borderRadius: 0.5 }} />
          <Typography variant="caption">Epic</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label="Story" sx={{ height: 18, bgcolor: 'secondary.light' }} />
          <Typography variant="caption">Story dans un sprint</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" label="Tache" color="warning" variant="outlined" sx={{ height: 18 }} />
          <Typography variant="caption">Echeance tache</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default PlanningCalendar;
