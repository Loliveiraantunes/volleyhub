import { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Chip, Container, Paper, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { TeamRoster } from '../../components/TeamRoster';
import { publicEventService } from '../../services/eventService';
import { publicTeamService } from '../../services/teamService';
import { publicMatchService } from '../../services/matchService';
import { standingsService } from '../../services/standingsService';
import type { BracketMatch, Event, Team, TeamDetailResponse } from '../../types/api';

function getMatchLabel(status: string, isWinner: boolean): string {
  if (status === 'FINISHED') {
    return isWinner ? 'Vencido' : 'Perdido';
  }
  if (status === 'SCHEDULED') {
    return 'Agendado';
  }
  return 'Em andamento';
}

function getChipColor(status: string, isWinner: boolean): 'success' | 'error' | 'default' {
  if (status !== 'FINISHED') return 'default';
  return isWinner ? 'success' : 'error';
}

async function fetchTeamMatches(bracket: any[], teamId: number): Promise<BracketMatch[]> {
  const teamMatches: BracketMatch[] = [];
  for (const group of bracket) {
    for (const round of group.rounds) {
      for (const match of round.matches) {
        if (match.homeTeamId === teamId || match.awayTeamId === teamId) {
          teamMatches.push(match);
        }
      }
    }
  }
  return teamMatches;
}

async function fetchTeamRoster(
  teamMatches: BracketMatch[],
  teamId: number,
  slug: string
): Promise<TeamDetailResponse | null> {
  if (teamMatches.length === 0) return null;
  const firstMatch = teamMatches[0];
  const matchData = await publicMatchService.findBySlugAndId(slug, firstMatch.matchId);
  return matchData.homeTeam.teamId === teamId ? matchData.homeTeam : matchData.awayTeam;
}

export function TeamPage() {
  const { slug, teamId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamDetailResponse | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !teamId) return;
    const numericTeamId = Number(teamId);
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [eventData, teams] = await Promise.all([
          publicEventService.findBySlug(slug),
          publicTeamService.listBySlug(slug),
        ]);
        if (cancelled) return;
        setEvent(eventData);
        setTeam(teams.find((t) => t.id === numericTeamId) ?? null);

        const bracket = await standingsService.publicBracket(slug);
        if (cancelled) return;

        const teamMatches = await fetchTeamMatches(bracket, numericTeamId);
        if (!cancelled) setMatches(teamMatches);

        const teamRoster = await fetchTeamRoster(teamMatches, numericTeamId, slug);
        if (!cancelled && teamRoster) setRoster(teamRoster);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, teamId]);

  if (loading) return <Loading />;
  if (!team || !event) return <EmptyState title="Equipe não encontrada" />;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Chip
          icon={<ArrowBackIcon />}
          label="Voltar"
          color="primary"
          variant="outlined"
          onClick={() => navigate(-1)}
          clickable
        />
      </Box>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack alignItems="center" spacing={1}>
          <Avatar src={team.logo ?? undefined} variant="rounded" sx={{ width: 96, height: 96 }}>
            <GroupsIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={800}>
            {team.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {event.name}
          </Typography>
          <StatusBadge status={team.registrationStatus} />
        </Stack>
      </Paper>

      {roster ? (
        <TeamRoster team={roster} />
      ) : (
        <Alert severity="info">A lista de jogadores desta equipe ainda não está disponível.</Alert>
      )}

      {matches.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
            Partidas
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#2f3137' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Fase</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Confronto</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Resultado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((match) => {
                  const numericTeamId = Number(teamId);
                  const isHome = match.homeTeamId === numericTeamId;
                  const opponent = isHome ? match.awayTeamName : match.homeTeamName;
                  const opponentLogo = isHome ? match.awayTeamLogo : match.homeTeamLogo;
                  const teamSets = isHome ? match.homeSetsWon : match.awaySetsWon;
                  const opponentSets = isHome ? match.awaySetsWon : match.homeSetsWon;
                  const isWinner = match.winnerTeamId === numericTeamId;
                  const isFinished = match.status === 'FINISHED';
                  const matchLabel = getMatchLabel(match.status, isWinner);
                  const chipColor = getChipColor(match.status, isWinner);

                  return (
                    <TableRow
                      key={match.matchId}
                      hover
                      onClick={() => navigate(`/event/${slug}/partida/${match.matchId}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(even)': { bgcolor: '#2f3137' },
                        backgroundColor: isWinner && isFinished ? 'rgba(167, 227, 173, 0.1)' : undefined,
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {match.displayOrder}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString('pt-BR') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar src={opponentLogo ?? undefined} sx={{ width: 32, height: 32 }} variant="rounded" />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {opponent || '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{ color: isWinner && isFinished ? '#a7e3ad' : 'text.primary' }}
                        >
                          {isFinished ? `${teamSets} x ${opponentSets}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={matchLabel} size="small" variant="outlined" color={chipColor} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
}


