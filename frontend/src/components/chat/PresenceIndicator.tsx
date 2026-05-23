import { Box } from '@mui/material';
import type { PresenceDisplay } from '../../store/presenceStore';

interface PresenceIndicatorProps {
  presence: PresenceDisplay;
  children: React.ReactElement;
  size?: 'small' | 'medium';
}

const COLORS: Record<PresenceDisplay, string> = {
  LIVE: '#44b700',
  BUSY: '#f44336',
  ABSENT: '#ff9800',
  OFFLINE: '#bdbdbd',
};

const PresenceIndicator = ({ presence, children, size = 'medium' }: PresenceIndicatorProps) => {
  const dotSize = size === 'small' ? 10 : 12;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          bgcolor: COLORS[presence],
          border: '2px solid white',
          boxSizing: 'border-box',
          ...(presence === 'LIVE' && {
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              border: `1px solid ${COLORS.LIVE}`,
              animation: 'presence-pulse 1.2s infinite ease-in-out',
            },
            '@keyframes presence-pulse': {
              '0%': { transform: 'scale(0.8)', opacity: 1 },
              '100%': { transform: 'scale(2)', opacity: 0 },
            },
          }),
        }}
      />
    </Box>
  );
};

export default PresenceIndicator;
