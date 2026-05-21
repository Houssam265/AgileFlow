import { useMemo, useState } from 'react';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { AccountTree, Category, Class, DeviceHub, Notes, RadioButtonChecked, Schema, Square, Timeline } from '@mui/icons-material';

export interface ShapeDefinition {
  type: string;
  label: string;
  defaultLabel?: string;
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
  { type: 'sequenceFrame', label: 'Cadre sequence', defaultLabel: 'opt', icon: <Schema />, width: 460, height: 240 },
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

export const ShapeLibrary = ({ selectedShape, onSelectShape }: ShapeLibraryProps) => {
  const [query, setQuery] = useState('');
  const filteredShapes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return SHAPES;
    return SHAPES.filter((shape) => (
      shape.label.toLowerCase().includes(normalizedQuery)
      || shape.type.toLowerCase().includes(normalizedQuery)
    ));
  }, [query]);

  return (
    <Box sx={{ width: 220, flexShrink: 0, alignSelf: 'stretch', bgcolor: 'grey.900', color: 'white', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Bibliotheque</Typography>
        <TextField
          size="small"
          placeholder="Rechercher..."
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          InputProps={{ sx: { bgcolor: 'grey.800', color: 'white', '& fieldset': { borderColor: 'grey.700' } } }}
        />
      </Box>
      <Divider sx={{ borderColor: 'grey.700' }} />
      <Stack sx={{ p: 1.5, overflow: 'auto', flex: 1, minHeight: 0 }} spacing={1}>
        {filteredShapes.map((shape) => (
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
        {filteredShapes.length === 0 && (
          <Typography variant="caption" sx={{ color: 'grey.400', px: 1 }}>
            Aucune forme trouvee.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
