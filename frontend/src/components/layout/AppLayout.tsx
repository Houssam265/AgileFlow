import { Box } from '@mui/material';
import { ReactNode } from 'react';

const AppLayout = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', height: '100vh' }}>
    <Box sx={{ width: 240, bgcolor: 'grey.900', color: 'white', p: 2 }}>
      Sidebar
    </Box>
    <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
      {children}
    </Box>
  </Box>
);

export default AppLayout;