import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Grid, TextField } from '@mui/material';
import type { PlayerRequest } from '../types/api';

function createSchema(minimumAgeEnabled?: boolean, minimumAge?: number | null) {
  return z.object({
    fullName: z.string().min(1, 'Informe o nome completo'),
    cpf: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable()
      .refine(
        (date) => {
          if (!minimumAgeEnabled || !minimumAge || !date) return true;
          
          const birthDate = new Date(date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          return age >= minimumAge;
        },
        {
          message: `Jogadores devem ter no mínimo ${minimumAge} anos para esta categoria`,
        }
      ),
  });
}

type FormData = z.infer<ReturnType<typeof createSchema>>;

function formatCpfInput(value: string | null | undefined) {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

interface PlayerFormProps {
  onSubmit: (data: PlayerRequest) => Promise<void> | void;
  minimumAgeEnabled?: boolean;
  minimumAge?: number | null;
}

export function PlayerForm({ onSubmit, minimumAgeEnabled, minimumAge }: Readonly<PlayerFormProps>) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(createSchema(minimumAgeEnabled, minimumAge)), defaultValues: { fullName: '', cpf: '', birthDate: '' } });

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
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <TextField
                label="CPF"
                fullWidth
                size="small"
                value={formatCpfInput(field.value)}
                onChange={(event) => field.onChange(event.target.value.replace(/\D/g, '').slice(0, 11))}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 14 } }}
              />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={5}>
          <TextField
            label="Nascimento"
            type="date"
            fullWidth
            size="small"
            error={!!errors.birthDate}
            helperText={errors.birthDate?.message}
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
