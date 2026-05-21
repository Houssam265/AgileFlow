import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline, ExpandMore } from '@mui/icons-material';
import type { Edge, Node } from 'reactflow';
import type { CollaboratorInfo } from '../../types';

interface PropertiesPanelProps {
  selectedNode?: Node | null;
  selectedEdge?: Edge | null;
  collaborators: CollaboratorInfo[];
  onNodeChange: (id: string, patch: Record<string, unknown>) => void;
  onEdgeChange: (id: string, patch: Record<string, unknown>) => void;
}

const toStringList = (value: unknown, fallback: string[]) => (
  Array.isArray(value) ? value.map(String) : fallback
);

const STEREOTYPE_SHAPES = new Set(['class', 'component', 'artifact', 'nodeBox']);

type ArrowPosition = 'none' | 'start' | 'end' | 'both';

const hasArrow = (value: unknown, marker: unknown) => {
  if (value === undefined || value === null || value === '') return Boolean(marker);
  return String(value) !== 'none';
};

const getArrowPosition = (edge: Edge): ArrowPosition => {
  const start = hasArrow(edge.data?.arrowStart, edge.markerStart);
  const end = hasArrow(edge.data?.arrowEnd, edge.markerEnd);

  if (start && end) return 'both';
  if (start) return 'start';
  if (end) return 'end';
  return 'none';
};

const getArrowPatch = (position: ArrowPosition) => ({
  arrowStart: position === 'start' || position === 'both' ? 'filled' : 'none',
  arrowEnd: position === 'end' || position === 'both' ? 'filled' : 'none',
});

export const PropertiesPanel = ({ selectedNode, selectedEdge, collaborators, onNodeChange, onEdgeChange }: PropertiesPanelProps) => {
  const element = selectedNode ?? selectedEdge;
  const selectedShape = selectedNode ? String(selectedNode.data?.shape ?? selectedNode.type) : '';
  const isClassNode = selectedShape === 'class';
  const isTextBox = selectedShape === 'textBox';
  const supportsStereotype = STEREOTYPE_SHAPES.has(selectedShape);
  const locked = Boolean(selectedNode?.data?.locked);
  const attributes = toStringList(selectedNode?.data?.attributes, ['- id: Long']);
  const methods = toStringList(selectedNode?.data?.methods, ['+ operation(): void']);

  const updateClassList = (field: 'attributes' | 'methods', values: string[]) => {
    if (!selectedNode) return;
    onNodeChange(selectedNode.id, { [field]: values });
  };

  return (
    <Box sx={{ width: 300, bgcolor: 'white', borderLeft: '1px solid', borderColor: 'grey.200', height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle2" fontWeight={800}>Proprietes</Typography>
      </Box>

      {element ? (
        <>
          <Accordion defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight={700}>Element</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                <TextField
                  label={isTextBox ? 'Texte' : 'Nom'}
                  size="small"
                  multiline={isTextBox}
                  minRows={isTextBox ? 3 : undefined}
                  value={selectedNode ? selectedNode.data?.label ?? '' : selectedEdge?.data?.label ?? selectedEdge?.label ?? ''}
                  onChange={(event) => selectedNode
                    ? onNodeChange(selectedNode.id, { label: event.target.value })
                    : selectedEdge && onEdgeChange(selectedEdge.id, { label: event.target.value })}
                />
                <TextField label="Type" size="small" value={selectedNode ? selectedNode.data?.shape ?? selectedNode.type : selectedEdge?.data?.edgeType ?? selectedEdge?.type} InputProps={{ readOnly: true }} />
                {selectedNode && supportsStereotype && (
                  <TextField
                    label="Stereotype"
                    size="small"
                    value={selectedNode.data?.stereotype ?? ''}
                    onChange={(event) => onNodeChange(selectedNode.id, { stereotype: event.target.value })}
                  />
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {selectedNode && (
            <>
              <Accordion defaultExpanded disableGutters>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight={700}>Style</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    <TextField type="color" label="Fond" size="small" value={selectedNode.data?.fill ?? '#ffffff'} onChange={(event) => onNodeChange(selectedNode.id, { fill: event.target.value })} />
                    <TextField type="color" label="Bordure" size="small" value={selectedNode.data?.borderColor ?? '#2563eb'} onChange={(event) => onNodeChange(selectedNode.id, { borderColor: event.target.value })} />
                    <Box>
                      <Typography variant="caption">Epaisseur bordure</Typography>
                      <Slider min={1} max={4} value={selectedNode.data?.borderWidth ?? 2} onChange={(_, value) => onNodeChange(selectedNode.id, { borderWidth: value })} />
                    </Box>
                    <Select size="small" value={selectedNode.data?.fontSize ?? 14} onChange={(event) => onNodeChange(selectedNode.id, { fontSize: Number(event.target.value) })}>
                      <MenuItem value={12}>12 px</MenuItem>
                      <MenuItem value={14}>14 px</MenuItem>
                      <MenuItem value={16}>16 px</MenuItem>
                    </Select>
                    <FormControlLabel control={<Checkbox checked={Boolean(selectedNode.data?.bold)} onChange={(event) => onNodeChange(selectedNode.id, { bold: event.target.checked })} />} label="Texte gras" />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {isClassNode && (
                <Accordion defaultExpanded disableGutters>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography fontWeight={700}>Attributs et methodes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" fontWeight={800}>Attributs</Typography>
                          <IconButton size="small" onClick={() => updateClassList('attributes', [...attributes, '- champ: Type'])}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Stack spacing={1}>
                          {attributes.map((attribute, index) => (
                            <Stack key={`attribute-${index}`} direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                value={attribute}
                                placeholder="- nom: Type"
                                onChange={(event) => {
                                  const next = [...attributes];
                                  next[index] = event.target.value;
                                  updateClassList('attributes', next);
                                }}
                              />
                              <IconButton size="small" color="error" onClick={() => updateClassList('attributes', attributes.filter((_, itemIndex) => itemIndex !== index))}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>

                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" fontWeight={800}>Methodes</Typography>
                          <IconButton size="small" onClick={() => updateClassList('methods', [...methods, '+ methode(): void'])}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Stack spacing={1}>
                          {methods.map((method, index) => (
                            <Stack key={`method-${index}`} direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                value={method}
                                placeholder="+ methode(): Type"
                                onChange={(event) => {
                                  const next = [...methods];
                                  next[index] = event.target.value;
                                  updateClassList('methods', next);
                                }}
                              />
                              <IconButton size="small" color="error" onClick={() => updateClassList('methods', methods.filter((_, itemIndex) => itemIndex !== index))}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              <Accordion disableGutters>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight={700}>Taille et position</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1}>
                      <TextField disabled={locked} label="X" type="number" size="small" value={Math.round(selectedNode.position.x)} onChange={(event) => onNodeChange(selectedNode.id, { positionX: Number(event.target.value) })} />
                      <TextField disabled={locked} label="Y" type="number" size="small" value={Math.round(selectedNode.position.y)} onChange={(event) => onNodeChange(selectedNode.id, { positionY: Number(event.target.value) })} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField disabled={locked} label="L" type="number" size="small" value={selectedNode.width ?? selectedNode.data?.width ?? 160} onChange={(event) => onNodeChange(selectedNode.id, { width: Number(event.target.value) })} />
                      <TextField disabled={locked} label="H" type="number" size="small" value={selectedNode.height ?? selectedNode.data?.height ?? 80} onChange={(event) => onNodeChange(selectedNode.id, { height: Number(event.target.value) })} />
                    </Stack>
                    <FormControlLabel control={<Checkbox checked={Boolean(selectedNode.data?.locked)} onChange={(event) => onNodeChange(selectedNode.id, { locked: event.target.checked })} />} label="Verrouiller" />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </>
          )}

          {selectedEdge && (
            <Accordion defaultExpanded disableGutters>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={700}>Connexion</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.5}>
                  <TextField size="small" label="Source" value={selectedEdge.source} InputProps={{ readOnly: true }} />
                  <TextField size="small" label="Cible" value={selectedEdge.target} InputProps={{ readOnly: true }} />
                  <Select size="small" value={selectedEdge.data?.edgeType ?? 'association'} onChange={(event) => onEdgeChange(selectedEdge.id, { edgeType: event.target.value })}>
                    <MenuItem value="association">Association</MenuItem>
                    <MenuItem value="dependency">Dependance</MenuItem>
                    <MenuItem value="inheritance">Heritage</MenuItem>
                    <MenuItem value="composition">Composition</MenuItem>
                    <MenuItem value="return">Retour</MenuItem>
                    <MenuItem value="communication">Communication</MenuItem>
                  </Select>
                  <Box>
                    <Typography variant="caption">Position de la fleche</Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={getArrowPosition(selectedEdge)}
                      onChange={(event) => onEdgeChange(selectedEdge.id, getArrowPatch(event.target.value as ArrowPosition))}
                    >
                      <MenuItem value="end">A la cible</MenuItem>
                      <MenuItem value="start">A la source</MenuItem>
                      <MenuItem value="both">Aux deux extremites</MenuItem>
                      <MenuItem value="none">Aucune fleche</MenuItem>
                    </Select>
                  </Box>
                  <FormControlLabel control={<Checkbox checked={Boolean(selectedEdge.animated)} onChange={(event) => onEdgeChange(selectedEdge.id, { animated: event.target.checked })} />} label="Animee" />
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </>
      ) : (
        <Typography sx={{ p: 2 }} variant="body2" color="text.secondary">Selectionnez un element pour modifier ses proprietes.</Typography>
      )}

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Collaborateurs</Typography>
        <Stack spacing={1}>
          {collaborators.length === 0 && <Typography variant="caption" color="text.secondary">Aucun autre utilisateur actif.</Typography>}
          {collaborators.map((user) => (
            <Stack key={user.userId} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: user.isActive ? user.color : 'grey.400' }} />
              <Box>
                <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                <Typography variant="caption" color="text.secondary">{user.permission ?? 'EDITOR'}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
