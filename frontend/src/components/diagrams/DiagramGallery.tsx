import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Delete, Share, VisibilityOff } from '@mui/icons-material';
import type { DiagramData } from '../../types';

interface DiagramGalleryProps {
  diagrams: DiagramData[];
  selectedId?: number | null;
  onSelect: (diagram: DiagramData) => void;
  onDelete: (diagram: DiagramData) => void;
}

const DiagramGallery = ({ diagrams, selectedId, onSelect, onDelete }: DiagramGalleryProps) => (
  <Stack spacing={1.5} data-testid="diagram-gallery">
    {diagrams.length === 0 ? (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="body2" color="text.secondary">Aucun diagramme.</Typography>
      </Paper>
    ) : diagrams.map((diagram) => {
      const active = selectedId === diagram.id;
      return (
        <Paper
          key={diagram.id}
          elevation={0}
          onClick={() => onSelect(diagram)}
          sx={{
            p: 2,
            cursor: 'pointer',
            borderRadius: 2,
            border: '1px solid',
            borderColor: active ? 'primary.main' : 'grey.200',
            bgcolor: active ? 'primary.50' : 'white',
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} noWrap>{diagram.titre}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{diagram.projectName}</Typography>
            </Box>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(diagram);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }} flexWrap="wrap">
            <Chip size="small" label={diagram.type} />
            {diagram.taskTitle && (
              <Chip size="small" label={`Tâche: ${diagram.taskTitle}`} color="info" variant="outlined" />
            )}
            <Chip size="small" icon={diagram.shared ? <Share /> : <VisibilityOff />} label={diagram.shared ? 'Partage' : 'Prive'} color={diagram.shared ? 'primary' : 'default'} />
          </Stack>
        </Paper>
      );
    })}
  </Stack>
);

export default DiagramGallery;
