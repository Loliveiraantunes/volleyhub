import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default', overflowX: 'hidden' }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
