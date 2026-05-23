import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { ProjectListItem } from '../../types';
import { formatDate } from '../../utils/formatDate';

const statusColor: Record<ProjectListItem['status'], 'success' | 'default' | 'info'> = {
  ACTIF: 'success',
  ARCHIVE: 'default',
  TERMINE: 'info',
};

const statusLabel: Record<ProjectListItem['status'], string> = {
  ACTIF: 'Actif',
  ARCHIVE: 'Archive',
  TERMINE: 'Termine',
};

type Props = {
  project: ProjectListItem;
  actions?: ReactNode;
};

const ProjectCard = ({ project, actions }: Props) => (
  <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{project.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {project.description || 'Aucune description.'}
          </Typography>
        </Box>
        <Chip size="small" color={statusColor[project.status]} label={statusLabel[project.status]} />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip size="small" variant="outlined" color={project.owner ? 'primary' : 'default'} label={`Proprietaire: ${project.managerName || 'Non defini'}`} />
        <Chip size="small" variant="outlined" label={`Membres: ${project.memberCount}`} />
        <Chip size="small" variant="outlined" label={`Equipe: ${project.teamName || 'Non definie'}`} />
        <Chip size="small" variant="outlined" label={`Sprints: ${project.sprintCount}`} />
        <Chip size="small" variant="outlined" label={`Taches: ${project.taskCount}`} />
      </Stack>

      <Box sx={{ mt: 'auto' }}>
        <Typography variant="caption" display="block" color="text.secondary">
          Debut: {formatDate(project.startDate)}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          Fin: {formatDate(project.endDate)}
        </Typography>
      </Box>

      {actions}
    </CardContent>
  </Card>
);

export default ProjectCard;
