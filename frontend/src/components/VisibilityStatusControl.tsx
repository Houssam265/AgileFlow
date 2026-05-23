import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import { WebSocketState } from '../hooks/useWebSocket';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';
import {
  loadSavedVisibility,
  usePresenceStore,
  type VisibilityStatus,
} from '../store/presenceStore';
import { fetchPresenceSnapshot, updateMyVisibility } from '../api/chatApi';

const STATUS_OPTIONS: {
  value: VisibilityStatus;
  label: string;
  color: string;
  description: string;
}[] = [
  { value: 'LIVE', label: 'En ligne', color: '#4caf50', description: 'Disponible pour discuter' },
  { value: 'ABSENT', label: 'Absent', color: '#9e9e9e', description: 'Indisponible temporairement' },
  { value: 'BUSY', label: 'Occupe', color: '#f44336', description: 'Ne pas deranger' },
];

interface VisibilityStatusControlProps {
  connectionState: WebSocketState;
}

const VisibilityStatusControl = ({ connectionState }: VisibilityStatusControlProps) => {
  const { user } = useAuthStore();
  const { publish } = useWebSocket();
  const myVisibilityStatus = usePresenceStore((s) => s.myVisibilityStatus);
  const setMyVisibilityStatus = usePresenceStore((s) => s.setMyVisibilityStatus);
  const setPresenceSnapshot = usePresenceStore((s) => s.setPresenceSnapshot);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [updating, setUpdating] = useState(false);

  const isConnected = connectionState === 'CONNECTED';
  const open = Boolean(anchorEl);

  const publishPresence = (status: VisibilityStatus, connected: boolean) => {
    if (!user) return;
    publish('/chat/presence', {
      userId: user.id,
      isOnline: connected,
      status,
    });
  };

  useEffect(() => {
    if (!user || !isConnected) return;

    const status = loadSavedVisibility();
    setMyVisibilityStatus(status);
    publishPresence(status, true);

    fetchPresenceSnapshot()
      .then(setPresenceSnapshot)
      .catch(console.error);
  }, [user?.id, isConnected]);

  useEffect(() => {
    if (!user || isConnected) return;
    publishPresence(myVisibilityStatus, false);
  }, [user?.id, isConnected]);

  const currentConfig = isConnected
    ? STATUS_OPTIONS.find((o) => o.value === myVisibilityStatus) ?? STATUS_OPTIONS[0]
    : {
        label: 'Hors ligne',
        color: '#bdbdbd',
        description: 'Connexion temps reel inactive',
      };

  const handleSelect = async (status: VisibilityStatus) => {
    setAnchorEl(null);
    if (!user || !isConnected || status === myVisibilityStatus) return;

    setUpdating(true);
    setMyVisibilityStatus(status);
    publishPresence(status, true);

    try {
      await updateMyVisibility(status);
      const snapshot = await fetchPresenceSnapshot();
      setPresenceSnapshot(snapshot);
    } catch (err) {
      console.error('Failed to update visibility', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Box
        onClick={(e) => isConnected && setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          cursor: isConnected ? 'pointer' : 'default',
          opacity: updating ? 0.7 : 1,
          '&:hover': isConnected ? { bgcolor: 'action.hover' } : {},
        }}
      >
        {updating ? (
          <CircularProgress size={12} />
        ) : (
          <FiberManualRecord sx={{ fontSize: 12, color: currentConfig.color }} />
        )}
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {currentConfig.label}
        </Typography>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === myVisibilityStatus}
            onClick={() => handleSelect(option.value)}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <FiberManualRecord sx={{ fontSize: 14, color: option.color }} />
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.description}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: 12 }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default VisibilityStatusControl;
