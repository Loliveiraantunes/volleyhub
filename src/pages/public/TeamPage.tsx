import { useEffect, useState } from 'react';
import { Alert, Avatar, Container, Paper, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { publicEventService } from '../../services/eventService';
import { publicTeamService } from '../../services/teamService';
import type { Event, Team } from '../../types/api';

export function TeamPage() {
  const { slug, teamId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !teamId) return;
    Promise.all([publicEventService.findBySlug(slug), publicTeamService.listBySlug(slug)])
      .then(([e, teams]) => {
        setEvent(e);
        setTeam(teams.find((t) => t.id === Number(teamId)) ?? null);
      })
      .finally(() => setLoading(false));
  }, [slug, teamId]);

  if (loading) return <Loading />;
  if (!team || !event) return <EmptyState title="Equipe não encontrada" />;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
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
        <Alert severity="info" sx={{ mt: 3 }}>
          A lista de jogadores e comissão técnica desta equipe é exibida apenas na área administrativa.
        </Alert>
      </Paper>
    </Container>
  );
}
