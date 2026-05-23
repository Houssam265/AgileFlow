import { useMemo } from 'react';
import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import type { EpicItem, EpicStatus } from '../../types';
import { EPIC_STATUS_CONFIG, EPIC_STATUS_ORDER } from '../../utils/planningConstants';
import EpicStatusChip from './EpicStatusChip';
import { epicDeliveryPercent, epicPlannedPercent } from '../../utils/storyProgress';

type Props = {
  epics: EpicItem[];
  canManage: boolean;
  onEdit: (epic: EpicItem) => void;
  onDelete: (epic: EpicItem) => void;
  onStatusChange: (epic: EpicItem, status: EpicStatus) => void;
};

const EpicStatusBoard = ({ epics, canManage, onEdit, onDelete, onStatusChange }: Props) => {
  const byStatus = useMemo(() => {
    const map = new Map<EpicStatus, EpicItem[]>();
    EPIC_STATUS_ORDER.forEach((s) => map.set(s, []));
    epics.forEach((e) => {
      const list = map.get(e.status) ?? [];
      list.push(e);
      map.set(e.status, list);
    });
    return map;
  }, [epics]);

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, minHeight: 320 }}>
      {EPIC_STATUS_ORDER.map((status) => {
        const column = byStatus.get(status) ?? [];
        const config = EPIC_STATUS_CONFIG[status];
        return (
          <Box
            key={status}
            sx={{
              minWidth: 260,
              flex: '0 0 auto',
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 320px)',
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>{config.label}</Typography>
                <Typography variant="caption" color="text.secondary">{column.length}</Typography>
              </Stack>
            </Box>
            <Stack spacing={1} sx={{ p: 1.5, overflowY: 'auto', flexGrow: 1 }}>
              {column.length === 0 ? (
                <Typography variant="caption" color="text.secondary">Aucun epic</Typography>
              ) : (
                column.map((epic) => (
                  <Paper key={epic.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderLeft: 4, borderLeftColor: epic.color }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body2" fontWeight={700}>{epic.title}</Typography>
                      {canManage && (
                        <Stack direction="row" spacing={0}>
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => onEdit(epic)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={() => onDelete(epic)}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      <EpicStatusChip status={epic.status} />
                      <Typography variant="caption">{epic.storyCount} stories · {epic.totalStoryPoints} pts</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Planif. {epicPlannedPercent(epic)}% · Livraison {epicDeliveryPercent(epic)}%
                    </Typography>
                    <LinearProgress variant="determinate" value={epicDeliveryPercent(epic)} sx={{ mt: 1, height: 5, borderRadius: 2 }} />
                    {canManage && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                        {EPIC_STATUS_ORDER.filter((s) => s !== epic.status).map((s) => (
                          <Typography
                            key={s}
                            variant="caption"
                            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => onStatusChange(epic, s)}
                          >
                            → {EPIC_STATUS_CONFIG[s].label}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))
              )}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
};

export default EpicStatusBoard;
