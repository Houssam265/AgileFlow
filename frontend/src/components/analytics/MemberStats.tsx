import { Box, Paper, Stack, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsMemberStats, AnalyticsTrendItem } from '../../types';

interface MemberStatsProps {
  memberStats: AnalyticsMemberStats[];
  trend: AnalyticsTrendItem[];
}

const shortDate = (date: string) => date.slice(5);

const MemberStats = ({ memberStats, trend }: MemberStatsProps) => {
  const barWidth = Math.max(520, memberStats.length * 140);
  const lineWidth = Math.max(620, trend.length * 34);
  const trendData = trend.map((item) => ({ ...item, dateLabel: shortDate(item.date) }));

  return (
    <Stack spacing={2.5} data-testid="member-stats">
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700}>Statistiques membres</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Volume d'activite et taches terminees par membre.
        </Typography>
        {memberStats.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Aucune activite sur la periode.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <BarChart width={barWidth} height={280} data={memberStats} margin={{ top: 8, right: 24, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="memberName" angle={-20} textAnchor="end" height={58} interval={0} />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="activityCount" name="Activites" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completedTasks" name="Taches terminees" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h6" fontWeight={700}>Evolution quotidienne</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ligne de tendance des activites et taches terminees.
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <LineChart width={lineWidth} height={280} data={trendData} margin={{ top: 8, right: 24, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dateLabel" />
            <YAxis allowDecimals={false} />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="activityCount" name="Activites" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="completedTasks" name="Taches terminees" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </Box>
      </Paper>
    </Stack>
  );
};

export default MemberStats;
