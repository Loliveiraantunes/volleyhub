import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import type { Match, MatchSetRequest, Team } from '../../types/api';
import { formatDateTime } from '../../utils/format';

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

  const hasUnsavedSetChanges = match
    ? JSON.stringify(sets) !== JSON.stringify(match.sets.map((set) => ({
      setNumber: set.setNumber,
      homePoints: set.homePoints,
      awayPoints: set.awayPoints,
    })))
    : false;

  const saveProgress = async () => {
    if (!match) return;
    setSaving(true);
    try {
      const updated = await matchService.updateSets(match.id, sets);
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
    if (!match || hasUnsavedSetChanges) return;
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

  const hasMeta = match.court || match.scheduledAt;

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

      <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
        {hasMeta && (
          <Box
            sx={{
              px: 3,
              py: 1.25,
              bgcolor: 'rgba(21,101,192,0.04)',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <StatusBadge status={match.status} />
            <Stack direction="row" spacing={2.5} divider={<Divider orientation="vertical" flexItem />}>
              {match.court && (
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {match.court}
                </Typography>
              )}
              {match.scheduledAt && (
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {formatDateTime(match.scheduledAt)}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        <Box sx={{ px: 3, py: hasMeta ? 4 : 3 }}>
          {!hasMeta && (
            <Stack alignItems="center" sx={{ mb: 2.5 }}>
              <StatusBadge status={match.status} />
            </Stack>
          )}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={4}>
            <Stack alignItems="center" spacing={1.5} flex={1}>
              <Avatar src={homeTeam.logo ?? undefined} variant="rounded" sx={{ width: 72, height: 72 }} />
              <Typography variant="h6" fontWeight={800} textAlign="center">
                {homeTeam.name}
              </Typography>
            </Stack>

            <Stack alignItems="center" spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  variant="h1"
                  fontWeight={900}
                  color={homeSetsWon > awaySetsWon ? 'primary.main' : 'text.secondary'}
                  sx={{ lineHeight: 1 }}
                >
                  {homeSetsWon}
                </Typography>
                <Typography variant="h4" color="text.disabled" fontWeight={300}>
                  ×
                </Typography>
                <Typography
                  variant="h1"
                  fontWeight={900}
                  color={awaySetsWon > homeSetsWon ? 'primary.main' : 'text.secondary'}
                  sx={{ lineHeight: 1 }}
                >
                  {awaySetsWon}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.disabled"
                fontWeight={700}
                sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}
              >
                sets
              </Typography>
            </Stack>

            <Stack alignItems="center" spacing={1.5} flex={1}>
              <Avatar src={awayTeam.logo ?? undefined} variant="rounded" sx={{ width: 72, height: 72 }} />
              <Typography variant="h6" fontWeight={800} textAlign="center">
                {awayTeam.name}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Sets ({sets.length})
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addSet}>
            Adicionar set
          </Button>
        </Stack>

        {sets.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr auto 1fr 40px',
              alignItems: 'center',
              gap: 1,
              px: 1,
              mb: 0.5,
            }}
          >
            <div />
            <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center" noWrap>
              {homeTeam.name}
            </Typography>
            <div />
            <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center" noWrap>
              {awayTeam.name}
            </Typography>
            <div />
          </Box>
        )}

        <Stack spacing={1}>
          {sets.map((set, index) => {
            const homeWon = set.homePoints > set.awayPoints;
            const awayWon = set.awayPoints > set.homePoints;
            return (
              <Box
                key={set.setNumber}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr auto 1fr 40px',
                  alignItems: 'center',
                  gap: 1,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Set {set.setNumber}
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={set.homePoints}
                  onChange={(e) => updateSet(index, 'homePoints', Number(e.target.value))}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      style: { textAlign: 'center', fontWeight: homeWon ? 800 : 400 },
                    },
                  }}
                />
                <Typography color="text.disabled" sx={{ px: 0.5 }}>
                  ×
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={set.awayPoints}
                  onChange={(e) => updateSet(index, 'awayPoints', Number(e.target.value))}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      style: { textAlign: 'center', fontWeight: awayWon ? 800 : 400 },
                    },
                  }}
                />
                <IconButton size="small" color="error" onClick={() => removeSet(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>

        {sets.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
            Nenhum set registrado ainda. Clique em “Adicionar set” para começar.
          </Typography>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={saveProgress} disabled={saving}>
            Salvar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => setConfirmOpen(true)}
            disabled={saving || sets.length === 0 || hasUnsavedSetChanges}
          >
            Finalizar súmula
          </Button>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar finalização da partida"
        description="A partida será finalizada ao clicar em Finalizar. O resultado será registrado e a classificação será atualizada. Deseja continuar?"
        confirmLabel="Finalizar"
        loading={saving}
        onConfirm={finalize}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
