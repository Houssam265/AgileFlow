import { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Avatar, Divider, IconButton, AppBar, Tooltip, Chip,
} from '@mui/material';
import {
  Dashboard, Assignment, Group, Timeline, Settings, Logout,
  Menu as MenuIcon, ChevronLeft, People,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 250;

const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/dashboard',  icon: <Dashboard /> },
  { label: 'Projets',         path: '/projects',   icon: <Assignment /> },
  { label: 'Utilisateurs',    path: '/users',      icon: <People /> },
  { label: 'Équipes',         path: '/teams',      icon: <Group /> },
  { label: 'Sprints',         path: '/sprints',    icon: <Timeline /> },
  { label: 'Paramètres',      path: '/settings',   icon: <Settings /> },
];

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }> = {
  ROLE_ADMIN:     { label: 'Admin',     color: 'error' },
  ROLE_MANAGER:   { label: 'Manager',   color: 'warning' },
  ROLE_DEVELOPER: { label: 'Dev',       color: 'info' },
};

const AppLayout = () => {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  const roleInfo = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'default' };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>

      {/* ── AppBar (Top) ── */}
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setOpen(!open)} size="small">
              {open ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>
            <Typography variant="h6" fontWeight={800} color="primary.main">AgileFlow</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={roleInfo.label} color={roleInfo.color} size="small" />
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Tooltip title="Se déconnecter">
              <IconButton onClick={handleLogout} color="default" size="small">
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar Drawer ── */}
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
        <Toolbar /> {/* Décale sous l'AppBar */}
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
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = path === '/teams'
              ? location.pathname.startsWith('/teams')
              : path === '/users'
                ? location.pathname.startsWith('/users')
                : location.pathname === path;
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

      <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f8fafc', overflow: 'auto', minWidth: 0 }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;