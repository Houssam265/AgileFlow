import { useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Logout,
  NotificationsOutlined,
  PersonOutline,
  RadioButtonChecked,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, { label: string; color: 'default' | 'error' | 'warning' | 'info' }> = {
  ROLE_ADMIN: { label: 'Admin', color: 'error' },
  ROLE_MANAGER: { label: 'Manager', color: 'warning' },
  ROLE_DEVELOPER: { label: 'Dev', color: 'info' },
};

const LINKS = [
  { path: '/profile/account', label: 'Mon compte', icon: <PersonOutline fontSize="small" /> },
  { path: '/profile/notifications', label: 'Notifications', icon: <NotificationsOutlined fontSize="small" /> },
  { path: '/profile/presence', label: 'Presence', icon: <RadioButtonChecked fontSize="small" /> },
];

const ProfileMenuButton = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const role = ROLE_LABELS[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'default' as const };
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? ''}`;
  const isProfilePage = location.pathname.startsWith('/profile');

  const goTo = (path: string) => {
    setAnchorEl(null);
    navigate(path);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Tooltip title="Mon profil">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          aria-label="Mon profil"
          sx={{
            p: 0.25,
            border: '2px solid',
            borderColor: isProfilePage ? 'primary.main' : 'transparent',
            borderRadius: '50%',
          }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
            {initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 280, mt: 1, borderRadius: 2, boxShadow: 4 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700} noWrap>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
          <Chip label={role.label} color={role.color} size="small" sx={{ mt: 1 }} />
        </Box>

        <Divider />

        {LINKS.map((link) => (
          <MenuItem
            key={link.path}
            selected={location.pathname === link.path}
            onClick={() => goTo(link.path)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{link.icon}</ListItemIcon>
            {link.label}
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          Se deconnecter
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenuButton;
