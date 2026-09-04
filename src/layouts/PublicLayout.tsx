import { Box, Container, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default', overflowX: 'hidden' }}>
        <Outlet />
      </Box>
      <Box component="footer" sx={{ py: 4, bgcolor: '#17181c', color: 'grey.100', borderTop: '4px solid', borderColor: 'primary.main' }}>
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
