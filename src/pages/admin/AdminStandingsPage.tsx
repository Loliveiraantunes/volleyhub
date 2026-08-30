import { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StandingsTable } from '../../components/StandingsTable';
import { standingsService } from '../../services/standingsService';
import type { GroupStandings } from '../../types/api';

export function AdminStandingsPage() {
  const { eventId } = useParams();
  const [standings, setStandings] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    standingsService
      .adminStandings(Number(eventId))
      .then(setStandings)
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <Box>
      <PageHeader title="Classificação" subtitle="Classificação por grupo do evento" />
      {loading ? (
        <Loading />
      ) : standings.length === 0 ? (
        <EmptyState title="Classificação ainda não disponível" description="Cadastre grupos e finalize confrontos para gerar a classificação." />
      ) : (
        <Grid container spacing={2}>
          {standings.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.groupId}>
              <StandingsTable standings={s} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
