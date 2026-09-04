import { useEffect, useState } from 'react';
import { Avatar, Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StandingsTable } from '../../components/StandingsTable';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { Event, GroupStandings } from '../../types/api';

function MetricCard({ icon, label, value, color }: Readonly<{ icon: React.ReactNode; label: string; value: number; color: string }>) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderTop: `3px solid ${color}` }}>
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

function Podium({ standings }: Readonly<{ standings: GroupStandings[] }>) {
  const entries = standings
    .flatMap((group) => group.entries)
    .sort((a, b) => (
      b.points - a.points ||
      (b.wins ?? 0) - (a.wins ?? 0) ||
      (b.setsWon ?? 0) - (a.setsWon ?? 0) ||
      a.teamName.localeCompare(b.teamName)
    ))
    .slice(0, 3);
  if (entries.length === 0) return null;
  const positions = [1, 0, 2];
  const medals = [
    { label: 'Prata', color: '#7c8796', height: 116 },
    { label: 'Ouro', color: '#c58b00', height: 148 },
    { label: 'Bronze', color: '#a85d35', height: 96 },
  ];

  return (
    <Card variant="outlined" sx={{ mb: 4, overflow: 'hidden', background: 'linear-gradient(135deg, #fff 0%, #f4f7fb 100%)' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <EmojiEventsIcon color="warning" />
          <Box>
            <Typography variant="h6" fontWeight={800}>Pódio geral</Typography>
            <Typography variant="body2" color="text.secondary">Os três melhores do evento</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="flex-end" justifyContent="center" spacing={{ xs: 0.5, sm: 2 }}>
          {positions.map((position, index) => {
            const entry = entries[position];
            const medal = medals[index];
            if (!entry) return <Box key={medal.label} sx={{ width: { xs: 96, sm: 150 } }} />;
            return (
              <Stack key={entry.teamId} alignItems="center" spacing={0.75} sx={{ width: { xs: 96, sm: 150 } }}>
                <Avatar src={entry.logo ?? undefined} variant="rounded" sx={{ width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, border: `3px solid ${medal.color}` }} />
                <Typography fontWeight={800} textAlign="center" noWrap sx={{ maxWidth: '100%' }}>{entry.teamName}</Typography>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  {entry.points} pts · {entry.wins ?? 0} vitórias · {entry.setsWon ?? 0} sets ganhos
                </Typography>
                <Box sx={{ width: '100%', height: medal.height, bgcolor: medal.color, color: 'white', display: 'flex', justifyContent: 'center', pt: 1.5, borderRadius: '8px 8px 0 0' }}>
                  <Typography fontWeight={900}>{medal.label}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function PublicStandingsPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([publicEventService.findBySlug(slug), standingsService.publicDetailedStandings(slug)])
      .then(([e, s]) => {
        setEvent(e);
        setStandings(s);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (!event) return <EmptyState title="Evento não encontrado" />;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5 }}>
        Classificação — {event.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Ranking por pontos, vitórias e sets ganhos</Typography>
      {standings.length === 0 ? (
        <EmptyState title="Classificação ainda não disponível" />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
            <MetricCard icon={<GroupsIcon />} label="Equipes" value={standings.reduce((total, group) => total + group.entries.length, 0)} color="#1565c0" />
            <MetricCard icon={<EmojiEventsIcon />} label="Vitórias" value={standings.flatMap((group) => group.entries).reduce((total, entry) => total + (entry.wins ?? 0), 0)} color="#f9a825" />
            <MetricCard icon={<ScoreboardIcon />} label="Sets ganhos" value={standings.flatMap((group) => group.entries).reduce((total, entry) => total + (entry.setsWon ?? 0), 0)} color="#6a1b9a" />
          </Box>
          <Podium standings={standings} />
          <Stack spacing={3}>
          {standings.map((s) => (
            <StandingsTable key={s.groupId} standings={s} />
          ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
