import { Box, Container, Stack, Typography } from '@mui/material';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#202126',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: { xs: 3, md: 4 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'center', md: 'flex-start' }}
          justifyContent="space-between"
        >
          {/* Logo and Description */}
          <Stack spacing={1} alignItems={{ xs: 'center', md: 'flex-start' }}>
            <img
              src="/logo.svg"
              alt="Dyoni Moura Logo"
              style={{
                height: '40px',
                width: 'auto',
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Plataforma completa de gerenciamento de campeonatos de vôlei
            </Typography>
          </Stack>

          {/* Links and Info */}
          <Stack spacing={2} alignItems={{ xs: 'center', md: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">
              © {currentYear} Dyoni Moura. Todos os direitos reservados.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Desenvolvido com ❤️ para a comunidade de vôlei
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
