import { Box, Paper, Typography } from '@mui/material';
import type { EpicItem, UserStoryItem } from '../../types';
import { epicDeliveryPercent } from '../../utils/storyProgress';

type Props = {
  epics: EpicItem[];
  stories: UserStoryItem[];
};

const StatCard = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: '1 1 140px', minWidth: 140 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{value}</Typography>
    {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
  </Paper>
);

const PlanningOverview = ({ epics, stories }: Props) => {
  const unplanned = stories.filter((s) => !s.sprintId).length;
  const planned = stories.length - unplanned;
  const doneStories = stories.filter((s) => s.done).length;
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const avgEpicProgress = epics.length === 0
    ? 0
    : Math.round(epics.reduce((sum, e) => sum + epicDeliveryPercent(e), 0) / epics.length);

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
      <StatCard label="Epics" value={epics.length} hint={`${avgEpicProgress}% livraison moy.`} />
      <StatCard label="Stories" value={stories.length} hint={`${doneStories} terminees`} />
      <StatCard label="Planifiees" value={planned} hint={`${unplanned} au backlog`} />
      <StatCard label="Story points" value={totalPoints} hint="Total backlog" />
    </Box>
  );
};

export default PlanningOverview;
