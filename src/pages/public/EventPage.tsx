import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
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

  const registrationIsOpen = event.registrationOpen && (
    !event.registrationEndAt || dayjs().isBefore(dayjs(event.registrationEndAt))
  );

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ position: 'relative', height: { xs: 240, sm: 380 }, bgcolor: '#1a2a4a' }}>
        {event.coverImage && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${event.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)',
          }}
        />
        <Container
          maxWidth="md"
          sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pb: { xs: 3, sm: 4 } }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
            <Chip
              label={genderLabels[event.gender] ?? event.gender}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700 }}
            />
            <Chip
              label={registrationIsOpen ? 'Inscrições abertas' : 'Inscrições fechadas'}
              size="small"
              color={registrationIsOpen ? 'success' : undefined}
              sx={!registrationIsOpen ? { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' } : {}}
            />
          </Stack>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{ color: 'white', textShadow: '0 2px 12px rgba(0,0,0,0.4)', lineHeight: 1.15, fontSize: { xs: '1.75rem', sm: '2.75rem' } }}
          >
            {event.name}
          </Typography>
          {(event.registrationStartAt || event.registrationEndAt) && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mt: 1 }}>
              Inscrições: {formatDate(event.registrationStartAt)} — {formatDate(event.registrationEndAt)}
            </Typography>
          )}
        </Container>
      </Box>

      {/* Action strip */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: 1.75 }}>
        <Container maxWidth="md">
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <span title={registrationIsOpen ? undefined : 'Inscrições encerradas'}>
              <Button
                variant="contained"
                disabled={!registrationIsOpen}
                onClick={() => navigate(`/event/${slug}/inscricao`)}
              >
                Inscrever equipe
              </Button>
            </span>
            <Button variant="outlined" onClick={() => navigate(`/event/${slug}/chave`)}>
              Chave / grupos
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/event/${slug}/classificacao`)}>
              Classificação
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Tabs + content */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
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
          teams.length === 0 ? (
            <EmptyState title="Nenhuma equipe aprovada ainda" />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} onClick={() => navigate(`/event/${slug}/equipe/${team.id}`)} />
              ))}
            </Box>
          )
        )}
      </Container>
    </Box>
  );
}
