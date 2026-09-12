import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(data);
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin';
      navigate(from, { replace: true });
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Não foi possível entrar. Verifique suas credenciais.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 4 }}>
      <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <img
          src="/logo.svg"
          alt="Dyoni Moura Logo"
          style={{
            height: '80px',
            width: 'auto',
          }}
        />
        <Typography variant="h5" fontWeight={800}>
          Acesse o Painel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerenciamento de campeonatos de vôlei
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="E-mail"
            type="email"
            fullWidth
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
