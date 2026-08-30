import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Grid, TextField } from '@mui/material';
import type { PlayerRequest } from '../types/api';

const schema = z.object({
  fullName: z.string().min(1, 'Informe o nome completo'),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface PlayerFormProps {
  onSubmit: (data: PlayerRequest) => Promise<void> | void;
}

export function PlayerForm({ onSubmit }: PlayerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { fullName: '', cpf: '', birthDate: '' } });

  const submit = async (data: FormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12}>
          <TextField
            label="Nome completo"
            fullWidth
            size="small"
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            {...register('fullName')}
          />
        </Grid>
        <Grid item xs={6} sm={5}>
          <TextField label="CPF" fullWidth size="small" {...register('cpf')} />
        </Grid>
        <Grid item xs={6} sm={5}>
          <TextField
            label="Nascimento"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            {...register('birthDate')}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: '40px' }}>
            +
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
