import { Chip } from '@mui/material';
import type { EpicStatus } from '../../types';
import { EPIC_STATUS_CONFIG } from '../../utils/planningConstants';

const EpicStatusChip = ({ status }: { status: EpicStatus }) => {
  const config = EPIC_STATUS_CONFIG[status];
  return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
};

export default EpicStatusChip;
