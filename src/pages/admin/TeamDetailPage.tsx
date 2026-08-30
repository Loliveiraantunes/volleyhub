import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { PlayerForm } from '../../components/PlayerForm';
import { StaffForm } from '../../components/StaffForm';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';
import { staffService } from '../../services/staffService';
import { eventService } from '../../services/eventService';
import type { Event, Player, Team, TechnicalStaff } from '../../types/api';
import { formatDate, staffRoleLabels } from '../../utils/format';

export function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [team, setTeam] = useState<Team | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [staff, setStaff] = useState<TechnicalStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    teamService
      .findById(Number(id))
      .then(async (t) => {
        setTeam(t);
        const [p, s, e] = await Promise.all([
          playerService.listByTeam(t.id),
          staffService.listByTeam(t.id),
          eventService.findById(t.eventId),
        ]);
        setPlayers(p);
        setStaff(s);
        setEvent(e);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleAddPlayer = async (data: { fullName: string; cpf?: string | null; birthDate?: string | null }) => {
    if (!team) return;
    try {
      const created = await playerService.create(team.id, data);
      setPlayers((prev) => [...prev, created]);
      enqueueSnackbar('Jogador adicionado.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível adicionar o jogador.', {
        variant: 'error',
      });
    }
  };

  const handleAddStaff = async (data: { fullName: string; role: 'COACH' | 'ASSISTANT' }) => {
    if (!team) return;
    try {
      const created = await staffService.create(team.id, data);
      setStaff((prev) => [...prev, created]);
      enqueueSnackbar('Integrante da comissão adicionado.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível adicionar o integrante.', {
        variant: 'error',
      });
    }
  };

  const handleAction = async () => {
    if (!team || !actionTarget) return;
    setProcessing(true);
    try {
      const updated = actionTarget === 'approve' ? await teamService.approve(team.id) : await teamService.reject(team.id);
      setTeam(updated);
      enqueueSnackbar(actionTarget === 'approve' ? 'Equipe aprovada com sucesso.' : 'Equipe reprovada.', {
        variant: 'success',
      });
      setActionTarget(null);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível processar a ação.', {
        variant: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading />;
  if (!team) return null;

  return (
    <Box>
      <PageHeader
        title={team.name}
        subtitle={event ? `Evento: ${event.name}` : undefined}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={team.registrationStatus === 'APPROVED'}
              onClick={() => setActionTarget('approve')}
            >
              Aprovar
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={team.registrationStatus === 'REJECTED'}
              onClick={() => setActionTarget('reject')}
            >
              Reprovar
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack alignItems="center" spacing={1}>
              <Avatar src={team.logo ?? undefined} variant="rounded" sx={{ width: 96, height: 96 }}>
                <GroupsIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                {team.name}
              </Typography>
              <StatusBadge status={team.registrationStatus} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Jogadores ({players.length}/14)
            </Typography>
            <List dense>
              {players.map((p) => (
                <ListItem key={p.id} disableGutters>
                  <ListItemAvatar>
                    <Avatar>{p.fullName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={p.fullName}
                    secondary={`CPF: ${p.cpf ?? '-'} • Nascimento: ${formatDate(p.birthDate)}`}
                  />
                </ListItem>
              ))}
            </List>
            {players.length < 14 && (
              <>
                <Divider sx={{ my: 2 }} />
                <PlayerForm onSubmit={handleAddPlayer} />
              </>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Comissão técnica ({staff.length}/2)
            </Typography>
            <List dense>
              {staff.map((s) => (
                <ListItem key={s.id} disableGutters>
                  <ListItemAvatar>
                    <Avatar>{s.fullName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={s.fullName} secondary={staffRoleLabels[s.role]} />
                </ListItem>
              ))}
            </List>
            {staff.length < 2 && (
              <>
                <Divider sx={{ my: 2 }} />
                <StaffForm onSubmit={handleAddStaff} />
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget === 'approve' ? 'Aprovar equipe' : 'Reprovar equipe'}
        description={`Confirma ${actionTarget === 'approve' ? 'a aprovação' : 'a reprovação'} da equipe "${team.name}"?`}
        danger={actionTarget === 'reject'}
        loading={processing}
        onConfirm={handleAction}
        onClose={() => setActionTarget(null)}
      />
    </Box>
  );
}
