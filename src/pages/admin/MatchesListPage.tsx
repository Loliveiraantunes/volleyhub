import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { MatchCard } from '../../components/MatchCard';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import { groupService } from '../../services/groupService';
import type { GroupStage, Match, MatchStatus, Team } from '../../types/api';

export function MatchesListPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<GroupStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([
      matchService.listByEvent(Number(eventId)),
      teamService.listByEvent(Number(eventId)),
      groupService.listByEvent(Number(eventId)),
    ])
      .then(([m, t, g]) => {
        setMatches(m);
        setTeams(t);
        setGroups(g);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const filtered = matches.filter((m) => {
    if (groupFilter !== 'ALL' && m.groupId !== groupFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (dateFilter && !(m.scheduledAt ?? '').startsWith(dateFilter)) return false;
    return true;
  });

  return (
    <Box>
      <PageHeader
        title="Confrontos"
        subtitle="Gerencie os jogos do evento"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/admin/events/${eventId}/matches/new`)}>
            Novo confronto
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Grupo"
            fullWidth
            size="small"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          >
            <MenuItem value="ALL">Todos</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Status"
            fullWidth
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MatchStatus | 'ALL')}
          >
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="SCHEDULED">Agendado</MenuItem>
            <MenuItem value="IN_PROGRESS">Em andamento</MenuItem>
            <MenuItem value="FINISHED">Finalizado</MenuItem>
            <MenuItem value="CANCELLED">Cancelado</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Data"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Grid>
      </Grid>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhum confronto encontrado" />
      ) : (
        <Stack spacing={2}>
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              homeTeamName={teamsById.get(m.homeTeamId)?.name ?? '—'}
              awayTeamName={teamsById.get(m.awayTeamId)?.name ?? '—'}
              onClick={() => navigate(`/admin/matches/${m.id}`)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
