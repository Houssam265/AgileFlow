import { useState, type MouseEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  IconButton,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, DeleteOutline, NotificationsNoneOutlined, NotificationsOutlined } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const NotifCenter = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Retour
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Centre de notifications
        </Typography>
        <Button variant="outlined" size="small" onClick={() => markAllAsRead()} disabled={unreadCount === 0}>
          Tout marquer comme lu
        </Button>
      </Box>

      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <NotificationsNoneOutlined sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">Aucune notification pour le moment.</Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                onClick={() => !notification.lu && markAsRead(notification.id)}
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  cursor: notification.lu ? 'default' : 'pointer',
                  bgcolor: !notification.lu ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                  '&:hover': {
                    bgcolor: !notification.lu
                      ? alpha(theme.palette.primary.main, 0.1)
                      : theme.palette.action.hover,
                  },
                }}
              >
                <NotificationsOutlined sx={{ mt: 0.5, color: 'primary.main' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatDistanceToNow(new Date(notification.dateCreation), { addSuffix: true, locale: fr })}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  disabled={deletingId === notification.id}
                  onClick={(e) => handleDelete(notification.id, e)}
                  aria-label="Supprimer la notification"
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
          {hasMore && (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Button size="small" onClick={() => loadMore()} disabled={loading}>
                Charger plus
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default NotifCenter;
