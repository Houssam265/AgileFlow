import { Box, Typography } from '@mui/material';
import NotificationPreferences from '../../components/users/NotificationPreferences';

const SettingsPage = () => {
  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Parametres
      </Typography>
      <NotificationPreferences />
    </Box>
  );
};

export default SettingsPage;
