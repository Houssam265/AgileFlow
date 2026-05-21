import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { AccountTree, Category, Class, DeviceHub, Notes, RadioButtonChecked, Schema, Square, Timeline } from '@mui/icons-material';

export interface ShapeDefinition {
  type: string;
  label: string;
  icon: JSX.Element;
  width: number;
  height: number;
}

export const SHAPES: ShapeDefinition[] = [
  { type: 'actor', label: 'Acteur', icon: <AccountTree />, width: 90, height: 120 },
  { type: 'useCase', label: 'Use case', icon: <RadioButtonChecked />, width: 170, height: 80 },
  { type: 'systemBoundary', label: 'Systeme', icon: <Schema />, width: 420, height: 260 },
  { type: 'class', label: 'Classe UML', icon: <Class />, width: 220, height: 170 },
  { type: 'lifeline', label: 'Lifeline', icon: <Timeline />, width: 140, height: 420 },
  { type: 'activity', label: 'Activite', icon: <Square />, width: 170, height: 70 },
  { type: 'decision', label: 'Decision', icon: <DeviceHub />, width: 120, height: 120 },
  { type: 'start', label: 'Depart', icon: <RadioButtonChecked />, width: 44, height: 44 },
  { type: 'end', label: 'Fin', icon: <RadioButtonChecked />, width: 44, height: 44 },
  { type: 'component', label: 'Composant', icon: <Category />, width: 180, height: 90 },
  { type: 'nodeBox', label: 'Noeud 3D', icon: <Schema />, width: 190, height: 110 },
  { type: 'artifact', label: 'Artifact', icon: <Notes />, width: 160, height: 80 },
  { type: 'note', label: 'Note', icon: <Notes />, width: 170, height: 90 },
  { type: 'rectangle', label: 'Rectangle', icon: <Square />, width: 160, height: 72 },
];

interface ShapeLibraryProps {
  selectedShape: string | null;
  onSelectShape: (shape: ShapeDefinition) => void;
}

export const ShapeLibrary = ({ selectedShape, onSelectShape }: ShapeLibraryProps) => (
  <Box sx={{ width: 220, bgcolor: 'grey.900', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Bibliotheque</Typography>
      <TextField
        size="small"
        placeholder="Rechercher..."
        fullWidth
        InputProps={{ sx: { bgcolor: 'grey.800', color: 'white', '& fieldset': { borderColor: 'grey.700' } } }}
      />
    </Box>
    <Divider sx={{ borderColor: 'grey.700' }} />
    <Stack sx={{ p: 1.5, overflow: 'auto' }} spacing={1}>
      {SHAPES.map((shape) => (
        <Button
          key={shape.type}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/agileflow-shape', JSON.stringify(shape));
            event.dataTransfer.effectAllowed = 'move';
          }}
          onClick={() => onSelectShape(shape)}
          startIcon={shape.icon}
          variant={selectedShape === shape.type ? 'contained' : 'text'}
          sx={{ justifyContent: 'flex-start', color: selectedShape === shape.type ? 'white' : 'grey.200', '&:hover': { bgcolor: 'grey.800' } }}
        >
          {shape.label}
        </Button>
      ))}
    </Stack>
    <Box sx={{ mt: 'auto', p: 1.5, borderTop: '1px solid', borderColor: 'grey.700' }}>
      <Typography variant="caption" sx={{ color: 'grey.400' }}>
        Glissez une forme sur le canvas ou cliquez puis cliquez sur le canvas.
      </Typography>
    </Box>
  </Box>
);
