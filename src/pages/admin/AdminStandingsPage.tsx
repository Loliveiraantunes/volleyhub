import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StandingsTable } from '../../components/StandingsTable';
import { eventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { GroupStandings } from '../../types/api';

function MetricCard({ icon, label, value, color }: Readonly<{ icon: React.ReactNode; label: string; value: number; color: string }>) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderTop: `3px solid ${color}`, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)' } }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: 'flex', p: 1, borderRadius: 2, bgcolor: color, color: 'white' }}>{icon}</Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const podiumStyles = [
  { label: 'Ouro', color: '#c58b00', height: 148, order: 1 },
  { label: 'Prata', color: '#7c8796', height: 116, order: 0 },
  { label: 'Bronze', color: '#a85d35', height: 96, order: 2 },
] as const;
const podiumStyleIndexByEntry = { 0: 0, 1: 1, 2: 2 } as const;

function Podium({ entries }: Readonly<{ entries: Array<{ teamId: number; teamName: string; logo?: string | null; points: number; wins?: number; setsWon?: number }> }>) {
  const topThree = entries.slice(0, 3);
  if (topThree.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 4, overflow: 'hidden', background: 'linear-gradient(135deg, #fff 0%, #f4f7fb 100%)' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <EmojiEventsIcon color="warning" />
          <Box>
            <Typography variant="h6" fontWeight={800}>Pódio geral</Typography>
            <Typography variant="body2" color="text.secondary">Os três melhores do evento</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="flex-end" justifyContent="center" spacing={{ xs: 0.5, sm: 2 }}>
          {[1, 0, 2].map((entryIndex) => {
            const entry = topThree[entryIndex];
            const style = podiumStyles[podiumStyleIndexByEntry[entryIndex as 0 | 1 | 2]];
            if (!entry) return <Box key={style.label} sx={{ width: { xs: 96, sm: 150 } }} />;
            return (
              <Stack key={entry.teamId} alignItems="center" spacing={0.75} sx={{ width: { xs: 96, sm: 150 } }}>
                <Avatar src={entry.logo ?? undefined} variant="rounded" sx={{ width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, border: `3px solid ${style.color}` }} />
                <Typography fontWeight={800} textAlign="center" noWrap sx={{ maxWidth: '100%' }}>{entry.teamName}</Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  {entry.points} pts · {entry.wins ?? 0} vitórias · {entry.setsWon ?? 0} sets ganhos
                </Typography>
                <Box sx={{ width: '100%', height: style.height, bgcolor: style.color, color: 'white', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 1.5, borderRadius: '8px 8px 0 0' }}>
                  <Typography fontWeight={900}>{style.label}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function AdminStandingsPage() {
  const { eventId } = useParams();
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    eventService.findById(Number(eventId))
      .then((event) => standingsService.publicDetailedStandings(event.slug))
      .then(setStandings)
      .finally(() => setLoading(false));
  }, [eventId]);

  const enrichedStandings = standings.map((group) => ({
    ...group,
    entries: group.entries
      .map((entry) => ({
        ...entry,
        wins: entry.wins ?? 0,
        setsWon: entry.setsWon ?? 0,
      }))
      .sort((a, b) => (
        b.points - a.points ||
        (b.wins ?? 0) - (a.wins ?? 0) ||
        (b.setsWon ?? 0) - (a.setsWon ?? 0) ||
        a.teamName.localeCompare(b.teamName)
      ))
      .map((entry, index) => ({ ...entry, position: index + 1 })),
  }));
  const totalTeams = new Set(standings.flatMap((group) => group.entries.map((entry) => entry.teamId))).size;
  const totalWins = enrichedStandings.flatMap((group) => group.entries).reduce((sum, entry) => sum + (entry.wins ?? 0), 0);
  const totalSetsWon = enrichedStandings.flatMap((group) => group.entries).reduce((sum, entry) => sum + (entry.setsWon ?? 0), 0);
  const podiumEntries = enrichedStandings
    .flatMap((group) => group.entries)
    .sort((a, b) => (
      b.points - a.points ||
      (b.wins ?? 0) - (a.wins ?? 0) ||
      (b.setsWon ?? 0) - (a.setsWon ?? 0) ||
      a.teamName.localeCompare(b.teamName)
    ));

  let content: React.ReactNode;
  if (loading) {
    content = <Loading />;
  } else if (standings.length === 0) {
    content = <EmptyState title="Classificação ainda não disponível" description="Cadastre grupos e finalize confrontos para gerar a classificação." />;
  } else {
    content = (
      <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <MetricCard icon={<GroupsIcon />} label="Equipes" value={totalTeams} color="#1565c0" />
          <MetricCard icon={<SportsVolleyballIcon />} label="Grupos" value={standings.length} color="#2e7d32" />
          <MetricCard icon={<EmojiEventsIcon />} label="Vitórias" value={totalWins} color="#f9a825" />
          <MetricCard icon={<ScoreboardIcon />} label="Sets ganhos" value={totalSetsWon} color="#6a1b9a" />
        </Box>
        <Podium entries={podiumEntries} />
        <Stack spacing={3}>
          {enrichedStandings.map((standing) => (
            <StandingsTable key={standing.groupId} standings={standing} />
          ))}
        </Stack>
      </>
    );
  }

  return (
    <Box>
      <PageHeader title="Classificação" subtitle="Classificação por grupo do evento" />
      {content}
    </Box>
  );
}
