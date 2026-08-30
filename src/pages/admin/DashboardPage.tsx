import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate } from 'react-router-dom';
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

function SummaryCard({ icon, label, value, color }: Readonly<{ icon: React.ReactNode; label: string; value: number | string; color: string }>) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ bgcolor: color, color: '#fff', borderRadius: 2, p: 1, display: 'flex' }}>{icon}</Box>
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      standingsService.adminStandings(selectedEvent.id),
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
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
    .slice(0, 4);

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
            <EmptyState title="Nenhum confronto agendado" />
          ) : (
            <Stack spacing={2}>
              {upcomingMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeamName={teamsById.get(m.homeTeamId)?.name ?? '—'}
                  awayTeamName={teamsById.get(m.awayTeamId)?.name ?? '—'}
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
          {standings.length === 0 ? (
            <EmptyState title="Classificação ainda não disponível" />
          ) : (
            <Stack spacing={2}>
              {standings.slice(0, 2).map((s) => (
                <StandingsTable key={s.groupId} standings={{ ...s, entries: s.entries.slice(0, 4) }} />
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
