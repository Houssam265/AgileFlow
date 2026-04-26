import { Box, Paper, Typography } from '@mui/material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BurndownPoint } from '../../types';

interface BurndownChartProps {
  points: BurndownPoint[];
}

const BurndownChart = ({ points }: BurndownChartProps) => {
  const width = Math.max(620, points.length * 38);
  const data = points.map((point) => ({ ...point, dateLabel: point.date.slice(5) }));

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }} data-testid="burndown-chart">
      <Typography variant="h6" fontWeight={700}>Burndown</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Restant reel compare a la trajectoire ideale.
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <LineChart width={width} height={300} data={data} margin={{ top: 8, right: 24, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="dateLabel" />
          <YAxis allowDecimals={false} />
          <RechartsTooltip />
          <Legend />
          <Line type="monotone" dataKey="remainingTasks" name="Restant" stroke="#dc2626" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="idealRemainingTasks" name="Ideal" stroke="#2563eb" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </Box>
    </Paper>
  );
};

export default BurndownChart;
