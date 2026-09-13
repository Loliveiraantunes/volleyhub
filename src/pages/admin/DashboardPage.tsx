import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LaunchIcon from '@mui/icons-material/Launch';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';
import { matchService } from '../../services/matchService';
import { standingsService } from '../../services/standingsService';
import type { GroupStandings, Match, Team } from '../../types/api';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { MatchCard } from '../../components/MatchCard';
import { StandingsTable } from '../../components/StandingsTable';

const STAGE_ORDER = {
  GROUP_STAGE: 0,
  QUARTERFINALS: 1,
  SEMIFINALS: 2,
  FINAL: 3,
} as const;

function SummaryCard({ icon, label, value, color }: Readonly<{ icon: React.ReactNode; label: string; value: number | string; color: string }>) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderTop: '3px solid #5a5e67',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-3px)', borderColor: 'primary.main', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)' },
      }}
    >
      <CardContent sx={{ height: '100%', boxSizing: 'border-box' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ bgcolor: '#3f4248', color: '#d0d3da', borderRadius: 1, p: 1, display: 'flex' }}>{icon}</Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { selectedEvent } = useSelectedEvent();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editData, setEditData] = useState({ scheduledAt: '', court: '' });
  const [savingMatch, setSavingMatch] = useState(false);

  useEffect(() => {
    if (!selectedEvent) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      teamService.listByEvent(selectedEvent.id),
      matchService.listByEvent(selectedEvent.id),
      standingsService.publicDetailedStandings(selectedEvent.slug),
    ])
      .then(async ([teamsData, matchesData, standingsData]) => {
        if (cancelled) return;
        setTeams(teamsData);
        setMatches(matchesData);
        setStandings(standingsData);
        const approved = teamsData.filter((t) => t.registrationStatus === 'APPROVED');
        const counts = await Promise.all(approved.map((t) => playerService.listByTeam(t.id)));
        if (!cancelled) setPlayersCount(counts.reduce((sum, list) => sum + list.length, 0));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedEvent]);

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const approvedTeams = teams.filter((t) => t.registrationStatus === 'APPROVED').length;
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED').length;
  const upcomingMatches = matches
    .filter((m) => m.status !== 'FINISHED')
    .sort((a, b) => {
      const stageDifference = (STAGE_ORDER[a.stage ?? 'GROUP_STAGE'] ?? -1)
        - (STAGE_ORDER[b.stage ?? 'GROUP_STAGE'] ?? -1);
      return stageDifference || (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '');
    })
    .slice(0, 4);

  const openEditMatch = (match: Match) => {
    setEditingMatch(match);
    setEditData({
      scheduledAt: match.scheduledAt ? dayjs(match.scheduledAt).format('YYYY-MM-DDTHH:mm') : '',
      court: match.court ?? '',
    });
  };

  const saveMatchDetails = async () => {
    if (!editingMatch) return;
    setSavingMatch(true);
    try {
      const updated = await matchService.update(editingMatch.id, {
        groupId: editingMatch.groupId,
        homeTeamId: editingMatch.homeTeamId,
        awayTeamId: editingMatch.awayTeamId,
        scheduledAt: editData.scheduledAt ? dayjs(editData.scheduledAt).toISOString() : null,
        court: editData.court || null,
        status: editingMatch.status,
        sets: editingMatch.sets.map((set) => ({
          setNumber: set.setNumber,
          homePoints: set.homePoints,
          awayPoints: set.awayPoints,
        })),
      });
      setMatches((current) => current.map((match) => match.id === updated.id ? updated : match));
      setEditingMatch(null);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível atualizar a partida.', {
        variant: 'error',
      });
    } finally {
      setSavingMatch(false);
    }
  };

  if (!selectedEvent) {
    return (
      <EmptyState
        title="Nenhum evento selecionado"
        description="Selecione um evento na lista de eventos para ver o resumo do dashboard."
        action={
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/admin/events')}
          >
            Ir para Eventos
          </Typography>
        }
      />
    );
  }

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumo do evento: ${selectedEvent.name}`}
        actions={
          <Button variant="outlined" startIcon={<LaunchIcon />} onClick={() => navigate(`/event/${selectedEvent.slug}/chave`)}>
            Ver bracket
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, mb: 4 }}>
        <Box>
          <SummaryCard icon={<GroupsIcon />} label="Equipes inscritas" value={teams.length} color="#1565c0" />
        </Box>
        <Box>
          <SummaryCard icon={<CheckCircleIcon />} label="Equipes aprovadas" value={approvedTeams} color="#2e7d32" />
        </Box>
        <Box>
          <SummaryCard icon={<PersonIcon />} label="Jogadores" value={playersCount} color="#6a1b9a" />
        </Box>
        <Box>
          <SummaryCard icon={<SportsVolleyballIcon />} label="Confrontos" value={matches.length} color="#f9a825" />
        </Box>
        <Box>
          <SummaryCard icon={<EventAvailableIcon />} label="Confrontos realizados" value={finishedMatches} color="#c62828" />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Próximos confrontos
          </Typography>
          {upcomingMatches.length === 0 ? (
            <EmptyState title="Nenhum confronto próximo" />
          ) : (
            <Stack spacing={2}>
              {upcomingMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeamName={teamsById.get(m.homeTeamId)?.name ?? 'TBD'}
                  awayTeamName={teamsById.get(m.awayTeamId)?.name ?? 'TBD'}
                  homeTeamLogo={teamsById.get(m.homeTeamId)?.logo}
                  awayTeamLogo={teamsById.get(m.awayTeamId)?.logo}
                  onEdit={() => openEditMatch(m)}
                  onClick={() => navigate(`/admin/matches/${m.id}`)}
                />
              ))}
            </Stack>
          )}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Classificação resumida
          </Typography>
          {(() => {
            // Extract all unclassified matches and calculate team stats
            const allUnclassifiedMatches = standings.flatMap((s) => s.unclassifiedMatches ?? []);
            const unclassifiedTeamsStats = new Map<number, { teamId: number; teamName: string; logo?: string | null; wins: number; setsWon: number; totalMatches: number; points: number }>();
            
            allUnclassifiedMatches.forEach((match) => {
              if (!unclassifiedTeamsStats.has(match.homeTeamId)) {
                unclassifiedTeamsStats.set(match.homeTeamId, {
                  teamId: match.homeTeamId,
                  teamName: match.homeTeamName,
                  logo: match.homeTeamLogo,
                  wins: 0,
                  setsWon: 0,
                  totalMatches: 0,
                  points: 0,
                });
              }
              if (!unclassifiedTeamsStats.has(match.awayTeamId)) {
                unclassifiedTeamsStats.set(match.awayTeamId, {
                  teamId: match.awayTeamId,
                  teamName: match.awayTeamName,
                  logo: match.awayTeamLogo,
                  wins: 0,
                  setsWon: 0,
                  totalMatches: 0,
                  points: 0,
                });
              }

              const homeStats = unclassifiedTeamsStats.get(match.homeTeamId)!;
              const awayStats = unclassifiedTeamsStats.get(match.awayTeamId)!;

              homeStats.totalMatches += 1;
              awayStats.totalMatches += 1;
              homeStats.setsWon += match.homeSetsWon;
              awayStats.setsWon += match.awaySetsWon;

              if (match.winnerTeamId === match.homeTeamId) {
                homeStats.wins += 1;
                homeStats.points += 3;
              } else if (match.winnerTeamId === match.awayTeamId) {
                awayStats.wins += 1;
                awayStats.points += 3;
              }
            });

            // Filter out empty standings and add unclassified games if available
            const filteredStandings = standings.filter(s => (s.entries?.length ?? 0) > 0);
            const displayStandings = [...filteredStandings];
            
            if (allUnclassifiedMatches.length > 0 && unclassifiedTeamsStats.size > 0) {
              const unclassifiedGroup = {
                groupId: 0,
                groupName: 'Jogos Livres',
                entries: Array.from(unclassifiedTeamsStats.values())
                  .map((stat, index) => ({
                    position: index + 1,
                    teamId: stat.teamId,
                    teamName: stat.teamName,
                    logo: stat.logo,
                    points: stat.points,
                    wins: stat.wins,
                    setsWon: stat.setsWon,
                    totalMatches: stat.totalMatches,
                    victories: stat.wins,
                    matchesWon: stat.wins,
                    wonSets: stat.setsWon,
                  }))
                  .sort((a, b) => (
                    b.points - a.points ||
                    (b.wins ?? 0) - (a.wins ?? 0) ||
                    (b.setsWon ?? 0) - (a.setsWon ?? 0) ||
                    a.teamName.localeCompare(b.teamName)
                  )),
              };
              displayStandings.push(unclassifiedGroup);
            }

            if (displayStandings.length === 0) {
              return <EmptyState title="Classificação ainda não disponível" />;
            }

            return (
              <Stack spacing={2}>
                {displayStandings.slice(0, 2).map((s) => (
                  <StandingsTable key={s.groupId} standings={{ ...s, entries: s.entries.slice(0, 4) }} onTeamClick={(teamId) => navigate(`/event/${selectedEvent?.slug}/equipe/${teamId}`)} />
                ))}
              </Stack>
            );
          })()}
        </Box>
      </Box>

      <Dialog open={!!editingMatch} onClose={() => !savingMatch && setEditingMatch(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar dados da partida</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Data e horário"
              type="datetime-local"
              fullWidth
              value={editData.scheduledAt}
              onChange={(event) => setEditData((current) => ({ ...current, scheduledAt: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Local"
              fullWidth
              value={editData.court}
              onChange={(event) => setEditData((current) => ({ ...current, court: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingMatch(null)} disabled={savingMatch}>Cancelar</Button>
          <Button variant="contained" onClick={saveMatchDetails} disabled={savingMatch}>
            {savingMatch ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
