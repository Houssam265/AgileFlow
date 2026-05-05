import { useState, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  Box,
  Typography,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  NotificationsOutlined,
  DeleteOutline,
  NotificationsNoneOutlined
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationBell = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const anchorEl = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore
  } = useNotifications();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleMarkAsRead = (id: number, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  const handleDelete = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleLoadMore = () => {
    loadMore();
  };

  return (
    <>
      <IconButton
        ref={anchorEl}
        onClick={handleOpen}
        size="small"
        sx={{ ml: 1 }}
        aria-label="Ouvrir les notifications"
      >
        <Badge badgeContent={unreadCount} color="error" showZero={false}>
          <NotificationsOutlined />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 500, display: 'flex', flexDirection: 'column' }
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              onClick={() => {
                handleClose();
                navigate('/notifications');
              }}
              sx={{ textTransform: 'none', fontSize: '0.875rem' }}
            >
              Voir tout
            </Button>
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              sx={{ textTransform: 'none', fontSize: '0.875rem' }}
            >
              Tout lu
            </Button>
          </Box>
        </Box>

        {/* Body - Notifications List */}
        {notifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              flexGrow: 1
            }}
          >
            <NotificationsNoneOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <List
            sx={{
              overflowY: 'auto',
              flexGrow: 1,
              p: 0
            }}
          >
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id, notification.lu)}
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: !notification.lu
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: !notification.lu
                      ? alpha(theme.palette.primary.main, 0.12)
                      : theme.palette.action.hover
                  },
                  '& .delete-btn': { visibility: 'hidden' },
                  '&:hover .delete-btn': { visibility: 'visible' },
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5
                }}
              >
                <NotificationsOutlined
                  sx={{ mt: 0.5, flexShrink: 0, fontSize: 20, color: 'primary.main' }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatDistanceToNow(new Date(notification.dateCreation), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleDelete(notification.id, e)}
                  sx={{
                    mt: 0.5,
                    flexShrink: 0,
                    '&:hover': { color: 'error.main' }
                  }}
                  className="delete-btn"
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}

        {/* Footer */}
        {hasMore && (
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Button
              size="small"
              onClick={handleLoadMore}
              sx={{ textTransform: 'none' }}
            >
              Charger plus
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationBell;
