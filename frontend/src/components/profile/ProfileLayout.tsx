import {
  Avatar,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  NotificationsOutlined,
  PersonOutline,
  RadioButtonChecked,
} from '@mui/icons-material';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'error' | 'warning' | 'info' }> = {
  ROLE_ADMIN: { label: 'Administrateur', color: 'error' },
  ROLE_MANAGER: { label: 'Manager', color: 'warning' },
  ROLE_DEVELOPER: { label: 'Developpeur', color: 'info' },
};

const NAV = [
  { to: '/profile/account', label: 'Mon compte', icon: <PersonOutline /> },
  { to: '/profile/notifications', label: 'Notifications', icon: <NotificationsOutlined /> },
  { to: '/profile/presence', label: 'Presence', icon: <RadioButtonChecked /> },
];

const ProfileLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'default' as const };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
        Mon profil
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Compte, notifications et statut de presence.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start' }}>
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Typography fontWeight={700}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {user?.email}
            </Typography>
            <Chip label={role.label} color={role.color} size="small" sx={{ mt: 1.5 }} />
          </Box>

          <List dense disablePadding>
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    py: 1.5,
                    borderLeft: 3,
                    borderColor: active ? 'primary.main' : 'transparent',
                    bgcolor: active ? 'primary.50' : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14 }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>

        <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileLayout;
