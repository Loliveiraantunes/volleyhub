import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { Footer } from '../components/Footer';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
        }}
      >
        <Container maxWidth="xs">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
