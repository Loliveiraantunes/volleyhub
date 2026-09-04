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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { publicEventService } from '../../services/eventService';
import { publicMatchService } from '../../services/matchService';
import type { Event, MatchDetailResponse, TeamDetailResponse } from '../../types/api';
import { formatDateTime, matchStatusLabels, staffRoleLabels } from '../../utils/format';

function TeamRoster({ team }: Readonly<{ team: TeamDetailResponse }>) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Avatar src={team.teamLogo ?? undefined} variant="rounded" sx={{ width: 36, height: 36 }}>
          <GroupsIcon fontSize="small" />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800}>{team.teamName}</Typography>
      </Stack>

      {team.players.length > 0 ? (
        <>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
          >
            Jogadores ({team.players.length})
          </Typography>
          <Stack spacing={0.25}>
            {team.players.map((player) => (
              <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, borderRadius: 1 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main', flexShrink: 0 }}>
                  {player.fullName[0]}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>{player.fullName}</Typography>
              </Box>
            ))}
          </Stack>
        </>
      ) : (
        <Alert severity="info">Jogadores não disponíveis para esta equipe.</Alert>
      )}

      {team.technicalStaff.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
          >
            Comissão técnica
          </Typography>
          <Stack spacing={0.25}>
            {team.technicalStaff.map((member) => (
              <Box
                key={member.id}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1, py: 0.75, borderRadius: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main', flexShrink: 0 }}>
                    {member.fullName[0]}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{member.fullName}</Typography>
                </Stack>
                <Chip label={staffRoleLabels[member.role]} size="small" variant="outlined" />
              </Box>
            ))}
          </Stack>
        </>
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<ArrowBackIcon />}
          label="Voltar para a chave"
          color="primary"
          variant="outlined"
          onClick={() => navigate(`/event/${slug}/chave`)}
          clickable
          sx={{ mb: 2 }}
        />
      </Box>
      <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
        <Box
          sx={{
            px: 3,
            py: 1.25,
            bgcolor: 'rgba(0,0,0,0.14)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Chip label={event.name} size="small" color="primary" variant="outlined" />
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
            <Chip label={matchStatusLabels[match.status] ?? match.status} color={match.status === 'FINISHED' ? 'success' : 'primary'} size="small" />
            {match.court && <Chip label={match.court} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: 'text.secondary' }} />}
            {match.scheduledAt && <Chip label={formatDateTime(match.scheduledAt)} variant="outlined" size="small" sx={{ color: 'text.primary', borderColor: 'text.secondary' }} />}
          </Stack>
        </Box>

        <Box sx={{ bgcolor: '#252b3d', borderTop: '3px solid', borderColor: 'primary.main', px: { xs: 2.5, md: 5 }, py: { xs: 4, md: 5 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 200px 1fr' }, gap: 3 }}>
            <Stack alignItems="center" spacing={1.5}>
              <Avatar
                src={match.homeTeam.teamLogo ?? undefined}
                variant="circular"
                sx={{ width: { xs: 80, md: 104 }, height: { xs: 80, md: 104 }, bgcolor: '#464950', border: '3px solid rgba(255,255,255,0.5)' }}
              >
                <GroupsIcon fontSize="large" />
              </Avatar>
              <Box textAlign="center">
                <Typography fontWeight={800} sx={{ color: 'white', fontSize: { xs: '1rem', md: '1.15rem' } }}>
                  {match.homeTeam.teamName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {match.homeSetsWon} sets vencidos
                </Typography>
              </Box>
              {match.winnerTeamId === match.homeTeam.teamId && (
                <Chip label="Vencedor" size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }} />
              )}
            </Stack>

            <Stack alignItems="center" justifyContent="center" spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography
                  fontWeight={900}
                  sx={{ color: 'white', fontSize: { xs: '4rem', md: '5.5rem' }, lineHeight: 1 }}
                >
                  {match.homeSetsWon}
                </Typography>
                <Typography sx={{ color: '#ff5964', fontSize: '2rem', fontWeight: 400 }}>×</Typography>
                <Typography
                  fontWeight={900}
                  sx={{ color: 'white', fontSize: { xs: '4rem', md: '5.5rem' }, lineHeight: 1 }}
                >
                  {match.awaySetsWon}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}
              >
                sets
              </Typography>
            </Stack>

            <Stack alignItems="center" spacing={1.5}>
              <Avatar
                src={match.awayTeam.teamLogo ?? undefined}
                variant="circular"
                sx={{ width: { xs: 80, md: 104 }, height: { xs: 80, md: 104 }, bgcolor: '#464950', border: '3px solid rgba(255,255,255,0.5)' }}
              >
                <GroupsIcon fontSize="large" />
              </Avatar>
              <Box textAlign="center">
                <Typography fontWeight={800} sx={{ color: 'white', fontSize: { xs: '1rem', md: '1.15rem' } }}>
                  {match.awayTeam.teamName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {match.awaySetsWon} sets vencidos
                </Typography>
              </Box>
              {match.winnerTeamId === match.awayTeam.teamId && (
                <Chip label="Vencedor" size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }} />
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Resultado por set
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
                      bgcolor: 'rgba(0,0,0,0.12)',
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
            <Alert severity="info" sx={{ bgcolor: '#3d4650', color: '#e1e8ef', border: '1px solid #71808f', '& .MuiAlert-icon': { color: '#9ed8ee' } }}>
              Ainda não há registros de sets para esta partida.
            </Alert>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3 }}>
        <TeamRoster team={match.homeTeam} />
        <TeamRoster team={match.awayTeam} />
      </Box>
    </Container>
  );
}
