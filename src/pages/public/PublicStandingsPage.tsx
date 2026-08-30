import { useEffect, useState } from 'react';
import { Container, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StandingsTable } from '../../components/StandingsTable';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { Event, GroupStandings } from '../../types/api';

export function PublicStandingsPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([publicEventService.findBySlug(slug), standingsService.publicStandings(slug)])
      .then(([e, s]) => {
        setEvent(e);
        setStandings(s);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading />;
  if (!event) return <EmptyState title="Evento não encontrado" />;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        Classificação — {event.name}
      </Typography>
      {standings.length === 0 ? (
        <EmptyState title="Classificação ainda não disponível" />
      ) : (
        <Stack spacing={3}>
          {standings.map((s) => (
            <StandingsTable key={s.groupId} standings={s} />
          ))}
        </Stack>
      )}
    </Container>
  );
}
