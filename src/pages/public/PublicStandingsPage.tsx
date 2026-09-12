import { useEffect, useState } from 'react';
import { Avatar, Box, Card, CardContent, Container, Stack, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { useNavigate, useParams } from 'react-router-dom';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StandingsTable } from '../../components/StandingsTable';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { Event, GroupStandings } from '../../types/api';

function MetricCard({ icon, label, value, color }: Readonly<{ icon: React.ReactNode; label: string; value: number; color: string }>) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderTop: '3px solid #5a5e67', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-3px)', borderColor: 'primary.main', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)' } }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: 'flex', p: 1, borderRadius: 1, bgcolor: '#3f4248', color: '#d0d3da' }}>{icon}</Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface PodiumEntry {
  teamId: number;
  teamName: string;
  logo?: string | null;
  points: number;
  wins?: number | null;
  setsWon?: number | null;
  totalMatches?: number | null;
}

interface PodiumCardProps {
  entry: PodiumEntry;
  position: 'first' | 'second' | 'third';
  colors: {
    bg: string;
    border: string;
    text: string;
  };
}

interface PodiumStylesResult {
  avatarSize: { xs: number; sm: number; md: number };
  avatarFontSize: { xs: string; md: string };
  medalSize: { xs: string; md: string };
  cardPadding: { xs: number; sm: number; md: number | string };
  pointsFontSize: { xs: string; md: string };
  positionFontSize: { xs: string; md: string };
  cardFlex: { xs: string; sm: string; md: number | string };
  cardTransform: { xs: string; md: string } | undefined;
}

function getPodiumStyles(isFirst: boolean, isSecond: boolean): PodiumStylesResult {
  const firstTransform = { xs: 'scale(1.05) translateY(-4px)', md: 'scale(1.1) translateY(-8px)' };
  const secondTransform = { xs: 'translateY(0px)', md: 'translateY(4px)' };
  let cardTransform: { xs: string; md: string } | undefined;
  if (isFirst) {
    cardTransform = firstTransform;
  } else if (isSecond) {
    cardTransform = secondTransform;
  }

  return {
    avatarSize: { xs: isFirst ? 56 : 48, sm: isFirst ? 76 : 56, md: isFirst ? 96 : 64 },
    avatarFontSize: { xs: isFirst ? '1.5rem' : '1rem', md: isFirst ? '2.5rem' : '1.5rem' },
    medalSize: { xs: isFirst ? '1.25rem' : '1rem', md: isFirst ? '2rem' : '1.5rem' },
    cardPadding: { xs: 1.5, sm: 2, md: isFirst ? 3 : 2.25 },
    pointsFontSize: { xs: isFirst ? '1.5rem' : '1.25rem', md: isFirst ? 'h5' : 'h6' },
    positionFontSize: { xs: isFirst ? '1.25rem' : '1rem', md: isFirst ? '1.5rem' : '1.25rem' },
    cardFlex: { xs: '1 1 calc(50% - 12px)', sm: '1 1 calc(33% - 12px)', md: isFirst ? 1.2 : 1 },
    cardTransform,
  };
}

function PodiumCard({ entry, position, colors }: Readonly<PodiumCardProps>) {
  const isFirst = position === 'first';
  const isSecond = position === 'second';
  const medals = { first: '🥇', second: '🥈', third: '🥉' };
  const positionLabels = { first: '1º', second: '2º', third: '3º' };
  const zIndexMap = { first: 3, second: 2, third: 1 };

  const {
    avatarSize,
    avatarFontSize,
    medalSize,
    cardPadding,
    pointsFontSize,
    positionFontSize,
    cardFlex,
    cardTransform,
  } = getPodiumStyles(isFirst, isSecond);

  return (
    <Card
      variant="outlined"
      sx={{
        flex: cardFlex,
        background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(32, 33, 38, 0.5) 100%)`,
        border: `2px solid ${colors.border}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        zIndex: zIndexMap[position] + 100,
        position: 'relative',
        transform: cardTransform,
        boxShadow: isFirst ? `0 12px 32px ${colors.border}44` : undefined,
        willChange: 'transform, box-shadow',
      }}
    >
      <CardContent sx={{ p: cardPadding, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mb: { xs: 1.25, md: 2 } }}>
          <Avatar
            src={entry.logo ?? undefined}
            variant="rounded"
            sx={{
              width: avatarSize,
              height: avatarSize,
              border: `3px solid ${colors.border}`,
              fontSize: avatarFontSize,
              bgcolor: '#3f4248',
            }}
          >
            {entry.teamName[0]}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              fontSize: medalSize,
              lineHeight: 1,
            }}
          >
            {medals[position]}
          </Box>
        </Box>

        <Typography
          variant={isFirst ? 'h6' : 'body2'}
          fontWeight={900}
          sx={{ mb: 0.5, color: colors.text, maxWidth: '90%', wordBreak: 'break-word', fontSize: { xs: '0.9rem', sm: '1rem', md: isFirst ? 'h6' : '1rem' } }}
        >
          {entry.teamName}
        </Typography>

        <Box sx={{ mb: { xs: 1.25, md: 2 }, width: '100%' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Pontos
          </Typography>
          <Typography
            variant={isFirst ? 'h5' : 'h6'}
            fontWeight={800}
            sx={{ color: colors.text, mb: { xs: 0.75, md: 1.5 }, fontSize: pointsFontSize }}
          >
            {entry.points}
          </Typography>
        </Box>

        <Box
          sx={{
            width: '100%',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colors.border}44`,
            borderRadius: 1,
            p: { xs: 1, md: 1.5 },
            mb: { xs: 1, md: 1.5 },
          }}
        >
          <Stack spacing={{ xs: 0.5, md: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: 'caption' } }}>
                Vitórias
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: colors.text, fontSize: { xs: '0.75rem', md: 'body2' } }}>
                {entry.wins ?? 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: 'caption' } }}>
                Sets ganhos
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: colors.text, fontSize: { xs: '0.75rem', md: 'body2' } }}>
                {entry.setsWon ?? 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: 'caption' } }}>
                Jogos
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: colors.text, fontSize: { xs: '0.75rem', md: 'body2' } }}>
                {entry.totalMatches ?? 0}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            width: '100%',
            py: { xs: 0.75, md: 1 },
            px: { xs: 1, md: 1.5 },
            borderRadius: 1,
            background: `linear-gradient(135deg, ${colors.border}22 0%, ${colors.border}11 100%)`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontSize: { xs: '0.7rem', md: 'caption' } }}>
            Posição
          </Typography>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ color: colors.text, fontSize: positionFontSize }}
          >
            {positionLabels[position]}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function Podium({ standings }: Readonly<{ standings: GroupStandings[] }>) {
  const entries = standings
    .flatMap((group) => group.entries)
    .filter((entry) => (entry.wins ?? 0) > 0)
    .sort((a, b) => (
      b.points - a.points ||
      (b.wins ?? 0) - (a.wins ?? 0) ||
      (b.setsWon ?? 0) - (a.setsWon ?? 0) ||
      a.teamName.localeCompare(b.teamName)
    ))
    .slice(0, 3);

  if (entries.length === 0) return null;

  const first = entries[0];
  const second = entries[1] || null;
  const third = entries[2] || null;

  const medalColors = {
    first: { bg: 'rgba(197, 139, 0, 0.15)', border: '#c58b00', text: '#ffc107' },
    second: { bg: 'rgba(124, 135, 150, 0.15)', border: '#7c8796', text: '#90a4ae' },
    third: { bg: 'rgba(168, 93, 53, 0.15)', border: '#a85d35', text: '#d7783b' },
  };

  return (
    <Box sx={{ mb: 4, position: 'relative', zIndex: 100 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <EmojiEventsIcon sx={{ color: '#ffc107', fontSize: '1.5rem' }} />
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Pódio geral
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Os três melhores do evento
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'flex-end' }}
        justifyContent="center"
        spacing={{ xs: 1, sm: 1.5, md: 1.5 }}
        sx={{
          mb: 3,
          position: 'relative',
          zIndex: 100,
          overflow: 'visible',
        }}
      >
        {second ? (
          <PodiumCard entry={second} position="second" colors={medalColors.second} />
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        <PodiumCard entry={first} position="first" colors={medalColors.first} />

        {third ? (
          <PodiumCard entry={third} position="third" colors={medalColors.third} />
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
      </Stack>
    </Box>
  );
}

export function PublicStandingsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
            <MetricCard icon={<GroupsIcon />} label="Equipes" value={standings.reduce((total, group) => total + group.entries.length, 0)} color="#1565c0" />
            <MetricCard icon={<EmojiEventsIcon />} label="Vitórias" value={standings.flatMap((group) => group.entries).reduce((total, entry) => total + (entry.wins ?? 0), 0)} color="#f9a825" />
            <MetricCard icon={<ScoreboardIcon />} label="Sets ganhos" value={standings.flatMap((group) => group.entries).reduce((total, entry) => total + (entry.setsWon ?? 0), 0)} color="#6a1b9a" />
            <MetricCard icon={<SportsVolleyballIcon />} label="Jogos jogados" value={Math.round(standings.flatMap((group) => group.entries).reduce((total, entry) => total + (entry.totalMatches ?? 0), 0))} color="#c62828" />
          </Box>
          <Podium standings={standings} />
          <Stack spacing={3}>
          {standings.map((s) => (
            <StandingsTable key={s.groupId} standings={s} onTeamClick={(teamId) => navigate(`/event/${slug}/equipe/${teamId}`)} />
          ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
