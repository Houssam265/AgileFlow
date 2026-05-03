import { Box, Typography, Tooltip } from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import { WebSocketState } from '../hooks/useWebSocket';

interface WebSocketStatusProps {
  connectionState: WebSocketState;
}

const WebSocketStatus = ({ connectionState }: WebSocketStatusProps) => {
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return {
          color: '#4caf50', // Green
          text: 'Live',
          tooltip: 'WebSocket connection active'
        };
      case 'CONNECTING':
        return {
          color: '#ff9800', // Orange
          text: 'Reconnecting...',
          tooltip: 'WebSocket connection establishing'
        };
      case 'DISCONNECTED':
        return {
          color: '#f44336', // Red
          text: 'Offline',
          tooltip: 'WebSocket connection lost'
        };
      default:
        return {
          color: '#9e9e9e', // Grey
          text: 'Unknown',
          tooltip: 'WebSocket connection status unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.tooltip} arrow>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '4px 8px',
          borderRadius: 1,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'default'
        }}
      >
        <FiberManualRecord
          sx={{
            fontSize: '12px',
            color: config.color,
            animation: connectionState === 'CONNECTING' ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 }
            }
          }}
        />
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.75rem'
          }}
        >
          {config.text}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default WebSocketStatus;