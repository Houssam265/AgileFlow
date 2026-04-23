import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography, Button } from '@mui/material';
import { formatDate } from '../../utils/formatDate';
import type { SprintItem } from '../../api/sprintsApi';
import StartSprintBtn from './StartSprintBtn';

type Props = {
  sprint: SprintItem;
  onStart?: () => Promise<void>;
  onFinish?: () => Promise<void>;
  onClick?: () => void;
  onDelete?: () => void;
};

const statusColor: Record<SprintItem['statut'], 'default' | 'success' | 'info'> = {
  PLANIFIE: 'default',
  EN_COURS: 'success',
  TERMINE: 'info',
};

const statusLabel: Record<SprintItem['statut'], string> = {
  PLANIFIE: 'Planifie',
  EN_COURS: 'En cours',
  TERMINE: 'Termine',
};

const SprintCard = ({ sprint, onStart, onFinish, onClick, onDelete }: Props) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
    <CardActionArea onClick={onClick} sx={{ height: '100%', alignItems: 'stretch' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{sprint.nom}</Typography>
          {sprint.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
              noWrap
            >
              {sprint.description}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Du {formatDate(sprint.dateDebut)} au {formatDate(sprint.dateFin)}
          </Typography>
        </Box>
        <Chip size="small" color={statusColor[sprint.statut]} label={statusLabel[sprint.statut]} />
      </Stack>

      <Stack direction="row" spacing={1}>
        <Chip
          size="small"
          variant="outlined"
          label={`Charge: ${sprint.pointsUtilises ?? 0}/${sprint.capacitePoints ?? 0} pts`}
        />
      </Stack>

      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        {onDelete && (
          <Button
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Supprimer
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {sprint.statut === 'PLANIFIE' && onStart && (
            <StartSprintBtn mode="start" onClick={onStart} />
          )}
          {sprint.statut === 'EN_COURS' && onFinish && (
            <StartSprintBtn mode="finish" onClick={onFinish} />
          )}
        </Box>
      </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default SprintCard;
