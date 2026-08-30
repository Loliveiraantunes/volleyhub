import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { TeamCard } from '../../components/TeamCard';
import { publicEventService } from '../../services/eventService';
import { publicTeamService } from '../../services/teamService';
import type { Event, Team } from '../../types/api';
import { formatDate, genderLabels } from '../../utils/format';

type TabKey = 'info' | 'regulation' | 'guide' | 'teams';

export function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('info');

  useEffect(() => {
    if (!slug) return;
    Promise.all([publicEventService.findBySlug(slug), publicTeamService.listBySlug(slug)])
      .then(([e, t]) => {
        setEvent(e);
        setTeams(t.filter((team) => team.registrationStatus === 'APPROVED'));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (!event) return <EmptyState title="Evento não encontrado" />;

  return (
    <Box>
      <Box
        sx={{
          height: { xs: 200, sm: 320 },
          backgroundColor: 'grey.300',
          backgroundImage: event.coverImage ? `url(${event.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          {event.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ my: 2 }} flexWrap="wrap">
          <Chip label={genderLabels[event.gender] ?? event.gender} />
          <Chip
            label={event.registrationOpen ? 'Inscrições abertas' : 'Inscrições fechadas'}
            color={event.registrationOpen ? 'success' : 'default'}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Período de inscrição: {formatDate(event.registrationStartAt)} — {formatDate(event.registrationEndAt)}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          {event.registrationOpen && (
            <Button variant="contained" size="large" onClick={() => navigate(`/event/${slug}/inscricao`)}>
              Inscrever equipe
            </Button>
          )}
          <Button variant="outlined" onClick={() => navigate(`/event/${slug}/chave`)}>
            Ver chave / grupos
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/event/${slug}/classificacao`)}>
            Classificação
          </Button>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
          <Tab label="Informações" value="info" />
          <Tab label="Regulamento" value="regulation" />
          <Tab label="Guia de Inscrição" value="guide" />
          <Tab label="Equipes" value="teams" />
        </Tabs>

        {tab === 'info' && (
          <Box dangerouslySetInnerHTML={{ __html: event.description || '<p>Sem informações cadastradas.</p>' }} />
        )}
        {tab === 'regulation' && (
          <Box dangerouslySetInnerHTML={{ __html: event.regulation || '<p>Regulamento não cadastrado.</p>' }} />
        )}
        {tab === 'guide' && (
          <Box dangerouslySetInnerHTML={{ __html: event.registrationGuide || '<p>Guia não cadastrado.</p>' }} />
        )}
        {tab === 'teams' && (
          <>
            {teams.length === 0 ? (
              <EmptyState title="Nenhuma equipe aprovada ainda" />
            ) : (
              <Grid container spacing={2}>
                {teams.map((team) => (
                  <Grid item xs={12} sm={6} key={team.id}>
                    <TeamCard team={team} onClick={() => navigate(`/event/${slug}/equipe/${team.id}`)} />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
