import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import {
  loadSavedVisibility,
  usePresenceStore,
  type VisibilityStatus,
} from '../../store/presenceStore';
import { fetchPresenceSnapshot, updateMyVisibility } from '../../api/chatApi';
import WebSocketStatus from '../WebSocketStatus';

const STATUS_OPTIONS: {
  value: VisibilityStatus;
  label: string;
  color: string;
  description: string;
}[] = [
  { value: 'LIVE', label: 'En ligne', color: '#4caf50', description: 'Disponible pour le chat et les collaborations.' },
  { value: 'ABSENT', label: 'Absent', color: '#9e9e9e', description: 'Indisponible temporairement.' },
  { value: 'BUSY', label: 'Occupe', color: '#f44336', description: 'Ne pas deranger — visible dans l en-tete.' },
];

const ProfilePresencePanel = () => {
  const { user } = useAuthStore();
  const { connectionState, publish } = useWebSocket();
  const myVisibilityStatus = usePresenceStore((s) => s.myVisibilityStatus);
  const setMyVisibilityStatus = usePresenceStore((s) => s.setMyVisibilityStatus);
  const setPresenceSnapshot = usePresenceStore((s) => s.setPresenceSnapshot);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = connectionState === 'CONNECTED';

  const publishPresence = (status: VisibilityStatus, connected: boolean) => {
    if (!user) return;
    publish('/chat/presence', { userId: user.id, isOnline: connected, status });
  };

  useEffect(() => {
    if (!user || !isConnected) return;
    const status = loadSavedVisibility();
    setMyVisibilityStatus(status);
    publishPresence(status, true);
    fetchPresenceSnapshot().then(setPresenceSnapshot).catch(() => undefined);
  }, [user?.id, isConnected]);

  const handleSelect = async (status: VisibilityStatus) => {
    if (!user || !isConnected || status === myVisibilityStatus) return;
    setUpdating(true);
    setError(null);
    setMyVisibilityStatus(status);
    publishPresence(status, true);
    try {
      await updateMyVisibility(status);
      const snapshot = await fetchPresenceSnapshot();
      setPresenceSnapshot(snapshot);
    } catch {
      setError('Impossible de mettre a jour le statut.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Statut de presence
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Visible par votre equipe dans le chat et l en-tete de l application.
          </Typography>
        </Box>
        <WebSocketStatus connectionState={connectionState} />
      </Stack>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Connexion temps reel inactive. Le statut sera synchronise a la reconnexion.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {updating && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">Mise a jour...</Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {STATUS_OPTIONS.map((option) => {
          const selected = myVisibilityStatus === option.value;
          return (
            <Card
              key={option.value}
              variant="outlined"
              sx={{
                borderColor: selected ? 'primary.main' : 'divider',
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? 'primary.50' : 'background.paper',
              }}
            >
              <CardActionArea onClick={() => handleSelect(option.value)} disabled={!isConnected || updating}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <FiberManualRecord sx={{ color: option.color, fontSize: 20 }} />
                  <Box>
                    <Typography fontWeight={700}>{option.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default ProfilePresencePanel;
