import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete, Edit, ExpandMore, Layers } from '@mui/icons-material';
import type { EpicItem, UserStoryItem } from '../../types';
import EpicStatusChip from './EpicStatusChip';
import UserStoryCard from './UserStoryCard';
import { epicDeliveryPercent, epicPlannedPercent } from '../../utils/storyProgress';

type Props = {
  epics: EpicItem[];
  stories: UserStoryItem[];
  canManage: boolean;
  onEditEpic: (epic: EpicItem) => void;
  onDeleteEpic: (epic: EpicItem) => void;
  onEdit: (story: UserStoryItem) => void;
  onDelete: (story: UserStoryItem) => void;
  onRemoveFromSprint: (story: UserStoryItem) => void;
  onOpenStory: (story: UserStoryItem) => void;
};

const BacklogEpicView = ({
  epics,
  stories,
  canManage,
  onEditEpic,
  onDeleteEpic,
  onEdit,
  onDelete,
  onRemoveFromSprint,
  onOpenStory,
}: Props) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const storiesByEpic = useMemo(() => {
    const map = new Map<number | 'none', UserStoryItem[]>();
    map.set('none', []);
    epics.forEach((e) => map.set(e.id, []));
    stories.forEach((s) => {
      const key = s.epicId ?? 'none';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [epics, stories]);

  const renderStories = (items: UserStoryItem[]) => (
    items.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Aucune story dans cette section.
      </Typography>
    ) : (
      <Stack spacing={1.5}>
        {items.map((story) => (
          <UserStoryCard
            key={story.id}
            story={story}
            canManage={canManage}
            compact
            onOpen={onOpenStory}
            onEdit={onEdit}
            onDelete={onDelete}
            onRemoveFromSprint={onRemoveFromSprint}
          />
        ))}
      </Stack>
    )
  );

  return (
    <Stack spacing={2}>
      {epics.map((epic) => {
        const epicStories = storiesByEpic.get(epic.id) ?? [];
        const plannedPct = epicPlannedPercent(epic);
        const deliveryPct = epicDeliveryPercent(epic);
        return (
          <Accordion
            key={epic.id}
            expanded={expanded[epic.id] !== false}
            onChange={(_, isExpanded) => setExpanded((c) => ({ ...c, [epic.id]: isExpanded }))}
            sx={{ borderRadius: 2, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
                <Box sx={{ width: 8, height: 48, borderRadius: 1, bgcolor: epic.color, flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Layers fontSize="small" color="action" />
                    <Typography fontWeight={700}>{epic.title}</Typography>
                    <EpicStatusChip status={epic.status} />
                    <Chip size="small" label={`${epic.storyCount} stories`} />
                    <Chip size="small" variant="outlined" label={`${epic.totalStoryPoints} pts`} />
                    {(epic.totalTaskCount ?? 0) > 0 && (
                      <Chip size="small" variant="outlined" label={`${epic.completedTaskCount}/${epic.totalTaskCount} taches`} />
                    )}
                  </Stack>
                  {epic.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                      {epic.description}
                    </Typography>
                  )}
                  <Stack spacing={0.5} sx={{ mt: 1, maxWidth: 480 }}>
                    <Typography variant="caption" color="text.secondary">Planification sprint · {plannedPct}%</Typography>
                    <LinearProgress variant="determinate" value={plannedPct} sx={{ height: 4, borderRadius: 2 }} />
                    <Typography variant="caption" color="text.secondary">Livraison (taches terminees) · {deliveryPct}%</Typography>
                    <LinearProgress variant="determinate" value={deliveryPct} color="success" sx={{ height: 4, borderRadius: 2 }} />
                  </Stack>
                </Box>
                {canManage && (
                  <Stack direction="row" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Modifier l'epic">
                      <IconButton size="small" onClick={() => onEditEpic(epic)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer l'epic">
                      <IconButton size="small" color="error" onClick={() => onDeleteEpic(epic)}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'grey.50' }}>
              {renderStories(epicStories)}
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Stories sans epic
        </Typography>
        {renderStories(storiesByEpic.get('none') ?? [])}
      </Box>
    </Stack>
  );
};

export default BacklogEpicView;
