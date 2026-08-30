import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';

export function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Outlet />
      </Container>
    </Box>
  );
}
