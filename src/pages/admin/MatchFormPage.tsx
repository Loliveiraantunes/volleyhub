import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, Grid, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import { groupService } from '../../services/groupService';
import type { GroupStage, MatchRequest, Team } from '../../types/api';

const schema = z
  .object({
    groupId: z.union([z.number(), z.literal('')]),
    homeTeamId: z.number({ invalid_type_error: 'Selecione a equipe A' }),
    awayTeamId: z.number({ invalid_type_error: 'Selecione a equipe B' }),
    scheduledAt: z.string().optional(),
    court: z.string().optional(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'As equipes devem ser diferentes',
    path: ['awayTeamId'],
  });

type FormData = z.infer<typeof schema>;

export function MatchFormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<GroupStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { groupId: '', homeTeamId: undefined, awayTeamId: undefined, scheduledAt: '', court: '' },
  });

  useEffect(() => {
    if (!eventId) return;
    Promise.all([teamService.listByEvent(Number(eventId)), groupService.listByEvent(Number(eventId))])
      .then(([t, g]) => {
        setTeams(t.filter((team) => team.registrationStatus === 'APPROVED'));
        setGroups(g);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const onSubmit = async (data: FormData) => {
    if (!eventId) return;
    setSaving(true);
    const payload: MatchRequest = {
      groupId: data.groupId === '' ? null : data.groupId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
      court: data.court || null,
      status: 'SCHEDULED',
      sets: [],
    };
    try {
      const created = await matchService.create(Number(eventId), payload);
      enqueueSnackbar('Confronto cadastrado.', { variant: 'success' });
      navigate(`/admin/matches/${created.id}`);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar o confronto.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader title="Novo confronto" />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <TextField select label="Grupo" fullWidth value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}>
                    <MenuItem value="">Sem grupo</MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Local" fullWidth {...register('court')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="homeTeamId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Equipe A"
                    fullWidth
                    error={!!errors.homeTeamId}
                    helperText={errors.homeTeamId?.message}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {teams.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="awayTeamId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Equipe B"
                    fullWidth
                    error={!!errors.awayTeamId}
                    helperText={errors.awayTeamId?.message}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {teams.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data e horário"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('scheduledAt')}
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={() => navigate(-1)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
