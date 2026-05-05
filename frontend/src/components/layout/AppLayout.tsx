import { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Assignment,
  AccountTree,
  ChevronLeft,
  Dashboard,
  Group,
  Insights,
  Logout,
  Menu as MenuIcon,
  People,
  Settings,
  Timeline,
  QueryStats,
  ViewKanban,
  ViewColumn,
  ChatBubbleOutline,
  AdminPanelSettings,
} from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatPanel from '../chat/ChatPanel';
import WebSocketStatus from '../WebSocketStatus';
import NotificationBell from '../notifications/NotificationBell';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useChat } from '../../hooks/useChat';

const DRAWER_WIDTH = 250;

const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Analytics', path: '/analytics', icon: <Insights /> },
  { label: 'Stats', path: '/stats', icon: <QueryStats /> },
  { label: 'DiagramFlow', path: '/diagrams', icon: <AccountTree /> },
  { label: 'Projets', path: '/projects', icon: <Assignment /> },
  { label: 'Backlog', path: '/backlog', icon: <ViewKanban /> },
  { label: 'Kanban', path: '/kanban', icon: <ViewColumn /> },
  { label: 'Utilisateurs', path: '/users', icon: <People /> },
  { label: 'Equipes', path: '/teams', icon: <Group /> },
  { label: 'Sprints', path: '/sprints', icon: <Timeline /> },
  { label: 'Parametres', path: '/settings', icon: <Settings /> },
];

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }> = {
  ROLE_ADMIN: { label: 'Admin', color: 'error' },
  ROLE_MANAGER: { label: 'Manager', color: 'warning' },
  ROLE_DEVELOPER: { label: 'Dev', color: 'info' },
};

const AppLayout = () => {
  const [open, setOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, logout } = useAuth();
  const { connectionState, publish } = useWebSocket();
  const { totalUnreadCount } = useChat({ isMonitor: true });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && connectionState === 'CONNECTED') {
      publish('/chat/presence', { userId: user.id, isOnline: true });
      
      const handleBeforeUnload = () => {
        publish('/chat/presence', { userId: user.id, isOnline: false });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        publish('/chat/presence', { userId: user.id, isOnline: false });
      };
    }
  }, [user, connectionState, publish]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const roleInfo = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'default' };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setOpen(!open)} size="small">
              {open ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>
            <Typography variant="h6" fontWeight={800} color="primary.main">AgileFlow</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WebSocketStatus connectionState={connectionState} />
            <NotificationBell />
            <Tooltip title="Ouvrir le chat">
              <IconButton onClick={() => setIsChatOpen(!isChatOpen)} color="inherit" size="small" sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={totalUnreadCount} color="error">
                  <ChatBubbleOutline fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Chip label={roleInfo.label} color={roleInfo.color} size="small" />
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Tooltip title="Se deconnecter">
              <IconButton onClick={handleLogout} color="default" size="small">
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 64,
          flexShrink: 0,
          transition: 'width 0.2s',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 64,
            overflowX: 'hidden',
            transition: 'width 0.2s',
            bgcolor: 'grey.900',
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: open ? 2 : 0.5, py: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
          </Avatar>
          {open && (
            <Box>
              <Typography variant="body1" fontWeight={600} noWrap>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" sx={{ color: 'grey.400' }} noWrap>{user?.email}</Typography>
            </Box>
          )}
        </Box>
        <Divider sx={{ borderColor: 'grey.700', mb: 1 }} />

        <List dense>
          {(user?.role === 'ROLE_ADMIN'
            ? [...NAV_ITEMS, { label: 'Administration', path: '/admin', icon: <AdminPanelSettings /> }]
            : NAV_ITEMS
          ).map(({ label, path, icon }) => {
            const active = path === '/dashboard'
              ? location.pathname === path
              : location.pathname === path || location.pathname.startsWith(`${path}/`);
            return (
              <ListItem key={path} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={!open ? label : ''} placement="right">
                  <ListItemButton
                    onClick={() => navigate(path)}
                    sx={{
                      px: open ? 2 : 1.5,
                      py: 1.2,
                      mx: 0.5,
                      borderRadius: 1,
                      bgcolor: active ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: active ? 'primary.dark' : 'grey.800' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? 'white' : 'grey.400' }}>{icon}</ListItemIcon>
                    {open && <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? 'white' : 'grey.300' }} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: '#f8fafc', 
          overflow: 'auto', 
          minWidth: 0,
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      <ChatPanel open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Box>
  );
};

export default AppLayout;
