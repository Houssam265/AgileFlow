import { Box, Paper, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { VelocityPoint } from '../../types';

interface VelocityChartProps {
  points: VelocityPoint[];
}

const VelocityChart = ({ points }: VelocityChartProps) => {
  const width = Math.max(620, points.length * 160);

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }} data-testid="velocity-chart">
      <Typography variant="h6" fontWeight={700}>Velocity</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Taches terminees, points livres et capacite par sprint.
      </Typography>
      {points.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Aucune velocity disponible.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <BarChart width={width} height={300} data={points} margin={{ top: 8, right: 24, left: 0, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="sprintName" angle={-18} textAnchor="end" height={58} interval={0} />
            <YAxis allowDecimals={false} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="completedTasks" name="Taches terminees" fill="#16a34a" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completedStoryPoints" name="Points livres" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="capacityPoints" name="Capacite" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </Box>
      )}
    </Paper>
  );
};

export default VelocityChart;
