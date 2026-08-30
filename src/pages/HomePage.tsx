import { Button, Container, Stack, Typography } from '@mui/material';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <SportsVolleyballIcon sx={{ fontSize: 64 }} color="primary" />
        <Typography variant="h4" fontWeight={800}>
          Volleyhub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Plataforma de gerenciamento de campeonatos de vôlei. Acesse a página do seu evento pelo link
          compartilhado pelo organizador.
        </Typography>
        <Button component={Link} to="/login" variant="outlined">
          Acessar painel administrativo
        </Button>
      </Stack>
    </Container>
  );
}
