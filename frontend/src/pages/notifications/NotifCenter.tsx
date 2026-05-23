import { useEffect, useState, type MouseEvent } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { DeleteOutline, NotificationsNoneOutlined, NotificationsOutlined, Send } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { sendAnnouncement, type AnnouncementTargetType } from '../../api/adminApi';
import { fetchProjects } from '../../api/projectsApi';
import { fetchUsers } from '../../api/usersApi';
import type { ProjectListItem, UserListItem } from '../../types';

const AdminAnnouncements = () => {
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('ALL_USERS');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [userId, setUserId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [projectRows, userRows] = await Promise.all([fetchProjects(), fetchUsers()]);
        setProjects(projectRows);
        setUsers(userRows.filter((user) => user.active !== false));
      } catch {
        setError('Impossible de charger les destinataires.');
      }
    };
    loadLookups();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Le message est obligatoire.');
      return;
    }
    if (targetType === 'PROJECT_MEMBERS' && !projectId) {
      setError('Selectionnez un projet.');
      return;
    }
    if (targetType === 'SPECIFIC_USER' && !userId) {
      setError('Selectionnez un utilisateur.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const result = await sendAnnouncement({
        targetType,
        projectId: targetType === 'PROJECT_MEMBERS' ? Number(projectId) : null,
        userId: targetType === 'SPECIFIC_USER' ? Number(userId) : null,
        message: message.trim(),
      });
      setMessage('');
      setSnack(`Notification envoyee a ${result.sentCount} utilisateur(s).`);
    } catch {
      setError("Impossible d'envoyer la notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
        Notifications / Announcements
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Envoyez une information aux utilisateurs de la plateforme.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="target-type-label">Cible</InputLabel>
              <Select
                labelId="target-type-label"
                label="Cible"
                value={targetType}
                onChange={(event) => {
                  setTargetType(event.target.value as AnnouncementTargetType);
                  setProjectId('');
                  setUserId('');
                }}
              >
                <MenuItem value="ALL_USERS">All users</MenuItem>
                <MenuItem value="PROJECT_MEMBERS">Specific project members</MenuItem>
                <MenuItem value="SPECIFIC_USER">Specific user</MenuItem>
              </Select>
            </FormControl>

            {targetType === 'PROJECT_MEMBERS' && (
              <Autocomplete
                size="small"
                options={projects}
                value={projects.find((project) => project.id === projectId) ?? null}
                getOptionLabel={(project) => project.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, project) => setProjectId(project?.id ?? '')}
                sx={{ minWidth: 300 }}
                renderInput={(params) => <TextField {...params} label="Projet" placeholder="Rechercher un projet" />}
              />
            )}

            {targetType === 'SPECIFIC_USER' && (
              <Autocomplete
                size="small"
                options={users}
                value={users.find((user) => user.id === userId) ?? null}
                getOptionLabel={(user) => `${user.firstName} ${user.lastName} - ${user.email}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, selectedUser) => setUserId(selectedUser?.id ?? '')}
                sx={{ minWidth: 340 }}
                renderInput={(params) => <TextField {...params} label="Utilisateur" placeholder="Rechercher un utilisateur" />}
              />
            )}
          </Stack>

          <TextField
            label="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            multiline
            minRows={4}
            inputProps={{ maxLength: 255 }}
            helperText={`${message.length}/255`}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={sending ? <CircularProgress color="inherit" size={18} /> : <Send />} onClick={handleSend} disabled={sending}>
              Envoyer
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Snackbar open={snack != null} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack} />
    </Box>
  );
};

const UserNotificationCenter = () => {
  const theme = useTheme();
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
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
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
                    bgcolor: !notification.lu ? alpha(theme.palette.primary.main, 0.1) : theme.palette.action.hover,
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

const NotifCenter = () => {
  const { user } = useAuth();
  return user?.role === 'ROLE_ADMIN' ? <AdminAnnouncements /> : <UserNotificationCenter />;
};

export default NotifCenter;
