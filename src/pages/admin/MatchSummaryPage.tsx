import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import type { Match, MatchSetRequest, Team } from '../../types/api';

export function MatchSummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [sets, setSets] = useState<MatchSetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isFinished = match?.status === 'FINISHED';

  const load = () => {
    if (!id) return;
    setLoading(true);
    matchService
      .findById(Number(id))
      .then(async (m) => {
        setMatch(m);
        setSets(m.sets.map((s) => ({ setNumber: s.setNumber, homePoints: s.homePoints, awayPoints: s.awayPoints })));
        const [home, away] = await Promise.all([teamService.findById(m.homeTeamId), teamService.findById(m.awayTeamId)]);
        setHomeTeam(home);
        setAwayTeam(away);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const homeSetsWon = sets.filter((s) => s.homePoints > s.awayPoints).length;
  const awaySetsWon = sets.filter((s) => s.awayPoints > s.homePoints).length;

  const addSet = () => {
    setSets((prev) => [...prev, { setNumber: prev.length + 1, homePoints: 0, awayPoints: 0 }]);
  };

  const removeSet = (index: number) => {
    setSets((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 })));
  };

  const updateSet = (index: number, field: 'homePoints' | 'awayPoints', value: number) => {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const saveProgress = async () => {
    if (!match) return;
    setSaving(true);
    try {
      const updated = await matchService.update(match.id, {
        groupId: match.groupId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        scheduledAt: match.scheduledAt,
        court: match.court,
        status: match.status === 'SCHEDULED' && sets.length > 0 ? 'IN_PROGRESS' : match.status,
        sets,
      });
      setMatch(updated);
      enqueueSnackbar('Súmula salva.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar os dados.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    if (!match) return;
    setSaving(true);
    try {
      const updated = await matchService.update(match.id, {
        groupId: match.groupId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        scheduledAt: match.scheduledAt,
        court: match.court,
        status: 'FINISHED',
        sets,
      });
      setMatch(updated);
      enqueueSnackbar('Súmula finalizada. Classificação e resultado atualizados.', { variant: 'success' });
      setConfirmOpen(false);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível finalizar a súmula.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!match || !homeTeam || !awayTeam) return null;

  return (
    <Box>
      <PageHeader
        title="Súmula"
        actions={
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <StatusBadge status={match.status} />
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
          <Stack alignItems="center" spacing={1} flex={1}>
            <Avatar src={homeTeam.logo ?? undefined} variant="rounded" sx={{ width: 56, height: 56 }} />
            <Typography fontWeight={700} textAlign="center">
              {homeTeam.name}
            </Typography>
          </Stack>
          <Typography variant="h3" fontWeight={800}>
            {homeSetsWon}
          </Typography>
          <Typography variant="h4" color="text.secondary">
            ×
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {awaySetsWon}
          </Typography>
          <Stack alignItems="center" spacing={1} flex={1}>
            <Avatar src={awayTeam.logo ?? undefined} variant="rounded" sx={{ width: 56, height: 56 }} />
            <Typography fontWeight={700} textAlign="center">
              {awayTeam.name}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Sets
        </Typography>
        <Stack spacing={2}>
          {sets.map((set, index) => (
            <Grid container spacing={2} alignItems="center" key={index}>
              <Grid item xs={2} sm={1}>
                <Typography fontWeight={700}>Set {set.setNumber}</Typography>
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  type="number"
                  label={homeTeam.name}
                  size="small"
                  fullWidth
                  disabled={isFinished}
                  value={set.homePoints}
                  onChange={(e) => updateSet(index, 'homePoints', Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField
                  type="number"
                  label={awayTeam.name}
                  size="small"
                  fullWidth
                  disabled={isFinished}
                  value={set.awayPoints}
                  onChange={(e) => updateSet(index, 'awayPoints', Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={2} sm={1}>
                {!isFinished && (
                  <IconButton color="error" onClick={() => removeSet(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}
        </Stack>

        {!isFinished && (
          <Button startIcon={<AddIcon />} onClick={addSet} sx={{ mt: 2 }}>
            Adicionar set
          </Button>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
          {isFinished ? (
            <Typography color="text.secondary" display="flex" alignItems="center" gap={1}>
              <LockIcon fontSize="small" /> Súmula finalizada. Edição bloqueada.
            </Typography>
          ) : (
            <>
              <Button variant="outlined" onClick={saveProgress} disabled={saving}>
                Salvar
              </Button>
              <Button variant="contained" color="success" onClick={() => setConfirmOpen(true)} disabled={saving || sets.length === 0}>
                Finalizar súmula
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="Finalizar súmula"
        description="Após finalizar, o resultado será registrado e a classificação será atualizada. Deseja continuar?"
        confirmLabel="Finalizar"
        loading={saving}
        onConfirm={finalize}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
