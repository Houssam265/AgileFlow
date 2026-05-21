import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountTree,
  CenterFocusStrong,
  Download,
  GridOn,
  PanTool,
  Redo,
  TextFields,
  Undo,
  ViewSidebar,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';

interface DiagramToolbarProps {
  selectedTool: string;
  zoom: number;
  showGrid: boolean;
  showLibrary: boolean;
  undoCount: number;
  redoCount: number;
  onToolChange: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onToggleGrid: () => void;
  onToggleLibrary: () => void;
  onAddText: () => void;
  onAutoLayout: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export const DiagramToolbar = ({
  selectedTool,
  zoom,
  showGrid,
  showLibrary,
  undoCount,
  redoCount,
  onToolChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleGrid,
  onToggleLibrary,
  onAddText,
  onAutoLayout,
  onExportPNG,
  onExportSVG,
}: DiagramToolbarProps) => {
  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'grey.200', bgcolor: 'white', px: 2, py: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Tooltip title="Selection">
          <IconButton color={selectedTool === 'select' ? 'primary' : 'default'} onClick={() => onToolChange('select')}><AccountTree /></IconButton>
        </Tooltip>
        <Tooltip title="Panoramique">
          <IconButton color={selectedTool === 'pan' ? 'primary' : 'default'} onClick={() => onToolChange('pan')}><PanTool /></IconButton>
        </Tooltip>
        <Button variant={showLibrary ? 'contained' : 'outlined'} size="small" startIcon={<ViewSidebar />} onClick={onToggleLibrary}>Bibliotheque</Button>
        <Button variant="outlined" size="small" startIcon={<TextFields />} onClick={onAddText}>Texte</Button>
        <Divider orientation="vertical" flexItem />
        <Button startIcon={<Undo />} disabled={undoCount === 0} onClick={onUndo}>Annuler ({undoCount})</Button>
        <Button startIcon={<Redo />} disabled={redoCount === 0} onClick={onRedo}>Retablir ({redoCount})</Button>
        <Divider orientation="vertical" flexItem />
        <IconButton onClick={onZoomOut}><ZoomOut /></IconButton>
        <Typography sx={{ minWidth: 52, textAlign: 'center', fontSize: 13 }}>{zoom}%</Typography>
        <IconButton onClick={onZoomIn}><ZoomIn /></IconButton>
        <IconButton onClick={onFit}><CenterFocusStrong /></IconButton>
        <Divider orientation="vertical" flexItem />
        <Button variant={showGrid ? 'contained' : 'outlined'} size="small" startIcon={<GridOn />} onClick={onToggleGrid}>Grille</Button>
        <Button variant="outlined" size="small" onClick={onAutoLayout}>Auto layout</Button>
        <Divider orientation="vertical" flexItem />
        <Button startIcon={<Download />} onClick={onExportPNG}>PNG</Button>
        <Button onClick={onExportSVG}>SVG</Button>
      </Stack>
    </Box>
  );
};
