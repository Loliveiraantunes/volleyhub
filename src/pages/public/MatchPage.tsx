import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { publicEventService } from '../../services/eventService';
import { publicMatchService } from '../../services/matchService';
import type { Event, MatchDetailResponse, TeamDetailResponse } from '../../types/api';
import { formatDateTime, staffRoleLabels } from '../../utils/format';

function TeamHeader({ team, setsWon, winnerTeamId }: Readonly<{ team: TeamDetailResponse; setsWon: number; winnerTeamId?: number | null }>) {
  const isWinner = winnerTeamId === team.teamId;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        height: '100%',
        borderColor: isWinner ? 'success.light' : 'divider',
        bgcolor: isWinner ? 'rgba(46, 125, 50, 0.04)' : 'background.paper',
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <Avatar src={team.teamLogo ?? undefined} variant="rounded" sx={{ width: 78, height: 78 }}>
          <GroupsIcon fontSize="large" />
        </Avatar>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={800}>
            {team.teamName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {setsWon} sets vencidos
          </Typography>
        </Box>
        {isWinner && <Chip label="Vencedor" color="success" size="small" />}
      </Stack>
    </Paper>
  );
}

function PeopleList({
  title,
  emptyText,
  people,
}: Readonly<{
  title: string;
  emptyText: string;
  people: Array<{ id: number; fullName: string; detail?: string | null }>;
}>) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {people.length > 0 ? (
        <Stack spacing={1}>
          {people.map((person) => (
            <Box
              key={person.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: 'grey.50',
              }}
            >
              <Typography fontWeight={700}>{person.fullName}</Typography>
              {person.detail && (
                <Typography variant="body2" color="text.secondary" textAlign="right">
                  {person.detail}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Alert severity="info">{emptyText}</Alert>
      )}
    </Paper>
  );
}

export function MatchPage() {
  const { slug, matchId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !matchId) return;

    const numericMatchId = Number(matchId);
    if (!Number.isFinite(numericMatchId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [eventData, matchData] = await Promise.all([
          publicEventService.findBySlug(slug),
          publicMatchService.findBySlugAndId(slug, numericMatchId),
        ]);

        if (cancelled) return;

        setEvent(eventData);
        setMatch(matchData);
      } catch {
        if (!cancelled) {
          setEvent(null);
          setMatch(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, matchId]);

  const sortedSets = useMemo(() => match?.sets.slice().sort((a, b) => a.setNumber - b.setNumber) ?? [], [match]);

  if (loading) return <Loading />;
  if (!event || !match) {
    return <EmptyState title="Partida não encontrada" description="A partida informada não está disponível no momento." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Chip label={event.name} size="small" color="primary" variant="outlined" sx={{ mb: 1.5 }} />
            <Typography variant="h4" fontWeight={800}>
              Detalhes da partida
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={match.status} color={match.status === 'FINISHED' ? 'success' : 'primary'} />
            {match.court && <Chip label={match.court} variant="outlined" />}
            {match.scheduledAt && <Chip label={formatDateTime(match.scheduledAt)} variant="outlined" />}
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px 1fr' }, gap: 3 }}>
          <TeamHeader team={match.homeTeam} setsWon={match.homeSetsWon} winnerTeamId={match.winnerTeamId} />

          <Paper variant="outlined" sx={{ p: 5, height: '100%', flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h2" fontWeight={900} color="primary.main">
                {match.homeSetsWon}
              </Typography>
              <Typography variant="h5" color="text.secondary">
                ×
              </Typography>
              <Typography variant="h2" fontWeight={900} color="primary.main">
                {match.awaySetsWon}
              </Typography>
          </Paper>

          <TeamHeader team={match.awayTeam} setsWon={match.awaySetsWon} winnerTeamId={match.winnerTeamId} />
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Pontuação por set
          </Typography>
            
          {sortedSets.length > 0 ? (
            <Stack spacing={1}>
              {sortedSets.map((set) => {
                const homeWon = set.homePoints > set.awayPoints;
                const awayWon = set.awayPoints > set.homePoints;
                return (
                  <Box
                    key={set.setNumber}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1.25,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={homeWon ? 800 : 500}
                      color={homeWon ? 'text.primary' : 'text.secondary'}
                      noWrap
                    >
                      {match.homeTeam.teamName}
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color={homeWon ? 'primary.main' : 'text.secondary'}
                        lineHeight={1}
                      >
                        {set.homePoints}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" fontWeight={700}>
                        Set {set.setNumber}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        color={awayWon ? 'primary.main' : 'text.secondary'}
                        lineHeight={1}
                      >
                        {set.awayPoints}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      fontWeight={awayWon ? 800 : 500}
                      color={awayWon ? 'text.primary' : 'text.secondary'}
                      textAlign="right"
                      noWrap
                    >
                      {match.awayTeam.teamName}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Alert severity="info">Ainda não há registros de sets para esta partida.</Alert>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Informações gerais
          </Typography>
          <Stack spacing={1.5}>
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">Status</Typography>
              <Typography fontWeight={700}>{match.status}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">Local</Typography>
              <Typography fontWeight={700}>{match.court ?? 'Não informado'}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">Data/Hora</Typography>
              <Typography fontWeight={700}>{match.scheduledAt ? formatDateTime(match.scheduledAt) : 'Não informado'}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" gap={2}>
              <Typography color="text.secondary">Total de sets</Typography>
              <Typography fontWeight={700}>{match.sets.length}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
        <PeopleList
          title={`Jogadores - ${match.homeTeam.teamName}`}
          emptyText="Jogadores não disponíveis para esta equipe."
          people={match.homeTeam.players.map((player) => ({
            id: player.id,
            fullName: player.fullName
          }))}
        />

        <PeopleList
          title={`Jogadores - ${match.awayTeam.teamName}`}
          emptyText="Jogadores não disponíveis para esta equipe."
          people={match.awayTeam.players.map((player) => ({
            id: player.id,
            fullName: player.fullName
          }))}
        />

        <PeopleList
          title={`Técnico / comissão - ${match.homeTeam.teamName}`}
          emptyText="Comissão técnica não disponível para esta equipe."
          people={match.homeTeam.technicalStaff.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            detail:  staffRoleLabels[member.role],
          }))}
        />

        <PeopleList
          title={`Técnico / comissão - ${match.awayTeam.teamName}`}
          emptyText="Comissão técnica não disponível para esta equipe."
          people={match.awayTeam.technicalStaff.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            detail: staffRoleLabels[member.role],
          }))}
        />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Chip label="Voltar" color="primary" variant="outlined" onClick={() => navigate(`/event/${slug}/chave`)} clickable />
      </Box>
    </Container>
  );
}
