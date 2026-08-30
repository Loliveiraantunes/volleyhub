import { Box, Container, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Box component="footer" sx={{ py: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="body2">Volleyhub</Typography>
            <Typography variant="caption" color="grey.400">
              Plataforma de gerenciamento de campeonatos de vôlei
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
