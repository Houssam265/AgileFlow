import { Button, Stack } from '@mui/material';
import { Download, TableChart } from '@mui/icons-material';

interface ExportButtonsProps {
  exporting: boolean;
  disabled?: boolean;
  onExportPdf: () => void;
  onExportCsv: () => void;
}

const ExportButtons = ({ exporting, disabled, onExportPdf, onExportCsv }: ExportButtonsProps) => (
  <Stack direction="row" spacing={1.5} flexWrap="wrap" data-testid="export-buttons">
    <Button
      variant="contained"
      startIcon={<Download />}
      disabled={disabled || exporting}
      onClick={onExportPdf}
    >
      PDF
    </Button>
    <Button
      variant="outlined"
      startIcon={<TableChart />}
      disabled={disabled || exporting}
      onClick={onExportCsv}
    >
      CSV
    </Button>
  </Stack>
);

export default ExportButtons;
