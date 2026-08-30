import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Grid, MenuItem, TextField } from '@mui/material';
import type { TechnicalStaffRequest } from '../types/api';

const schema = z.object({
  fullName: z.string().min(1, 'Informe o nome'),
  role: z.enum(['COACH', 'ASSISTANT']),
});

type FormData = z.infer<typeof schema>;

interface StaffFormProps {
  onSubmit: (data: TechnicalStaffRequest) => Promise<void> | void;
}

export function StaffForm({ onSubmit }: StaffFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { fullName: '', role: 'COACH' } });

  const submit = async (data: FormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nome"
            fullWidth
            size="small"
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            {...register('fullName')}
          />
        </Grid>
        <Grid item xs={8} sm={4}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TextField select label="Função" fullWidth size="small" {...field}>
                <MenuItem value="COACH">Técnico</MenuItem>
                <MenuItem value="ASSISTANT">Assistente/Auxiliar</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={4} sm={2}>
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: '40px' }}>
            +
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
