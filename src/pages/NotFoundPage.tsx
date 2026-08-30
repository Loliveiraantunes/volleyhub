import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs" sx={{ py: 10, textAlign: 'center' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2" fontWeight={800} color="primary">
          404
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Página não encontrada.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Voltar ao início
        </Button>
      </Stack>
    </Container>
  );
}
