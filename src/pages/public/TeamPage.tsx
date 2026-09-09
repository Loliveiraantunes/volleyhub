import { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Chip, Container, Paper, Stack, Typography } from '@mui/material';
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
import type { BracketGroupTree, Event, Team, TeamDetailResponse } from '../../types/api';

function findMatchIdForTeam(groups: BracketGroupTree[], teamId: number): number | null {
  for (const group of groups) {
    for (const round of group.rounds) {
      for (const match of round.matches) {
        if (match.homeTeamId === teamId || match.awayTeamId === teamId) {
          return match.matchId;
        }
      }
    }
  }
  return null;
}

export function TeamPage() {
  const { slug, teamId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<TeamDetailResponse | null>(null);
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
        const matchId = findMatchIdForTeam(bracket, numericTeamId);
        if (matchId != null) {
          const matchData = await publicMatchService.findBySlugAndId(slug, matchId);
          if (cancelled) return;
          const teamDetail = matchData.homeTeam.teamId === numericTeamId ? matchData.homeTeam : matchData.awayTeam;
          setRoster(teamDetail);
        }
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
    </Container>
  );
}

