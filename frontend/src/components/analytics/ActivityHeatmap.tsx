import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ActivityHeatmapItem } from '../../types';

interface ActivityHeatmapProps {
  items: ActivityHeatmapItem[];
}

const levelColor = (count: number) => {
  if (count === 0) return '#e5e7eb';
  if (count <= 2) return '#bfdbfe';
  if (count <= 5) return '#60a5fa';
  if (count <= 9) return '#2563eb';
  return '#1e3a8a';
};

const dayLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

const ActivityHeatmap = ({ items }: ActivityHeatmapProps) => (
  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h6" fontWeight={700}>Heatmap activite</Typography>
        <Typography variant="body2" color="text.secondary">Distribution quotidienne des evenements.</Typography>
      </Box>
    </Stack>

    <Box sx={{ overflowX: 'auto', pb: 1 }}>
      <Box
        data-testid="activity-heatmap"
        sx={{
          display: 'grid',
          gridTemplateRows: 'repeat(7, 14px)',
          gridAutoFlow: 'column',
          gridAutoColumns: '14px',
          gap: '4px',
          alignItems: 'center',
          minHeight: 122,
          width: 'max-content',
        }}
      >
        {items.map((item) => (
          <Box
            key={item.date}
            data-testid="heatmap-cell"
            title={`${dayLabel(item.date)}: ${item.activityCount} activites`}
            sx={{
              width: 14,
              height: 14,
              borderRadius: '3px',
              bgcolor: levelColor(item.activityCount),
              border: '1px solid rgba(15, 23, 42, 0.06)',
            }}
          />
        ))}
      </Box>
    </Box>

    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">Moins</Typography>
      {[0, 2, 5, 9, 12].map((count) => (
        <Box
          key={count}
          sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: levelColor(count), border: '1px solid rgba(15, 23, 42, 0.06)' }}
        />
      ))}
      <Typography variant="caption" color="text.secondary">Plus</Typography>
    </Stack>
  </Paper>
);

export default ActivityHeatmap;
