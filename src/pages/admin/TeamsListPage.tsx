import { useEffect, useState } from 'react';
import { Avatar, Box, IconButton, Stack, Tabs, Tab, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { teamService } from '../../services/teamService';
import { playerService } from '../../services/playerService';
import type { RegistrationStatus, Team } from '../../types/api';

const FILTERS: { label: string; value: RegistrationStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Pagamento enviado', value: 'PAYMENT_SENT' },
  { label: 'Em análise', value: 'UNDER_REVIEW' },
  { label: 'Aprovadas', value: 'APPROVED' },
  { label: 'Reprovadas', value: 'REJECTED' },
];

export function TeamsListPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
  const [actionTarget, setActionTarget] = useState<{ team: Team; action: 'approve' | 'reject' } | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    if (!eventId) return;
    setLoading(true);
    teamService
      .listByEvent(Number(eventId))
      .then(async (data) => {
        setTeams(data);
        const entries = await Promise.all(
          data.map(async (t) => [t.id, (await playerService.listByTeam(t.id)).length] as const),
        );
        setPlayerCounts(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const filteredTeams = filter === 'ALL' ? teams : teams.filter((t) => t.registrationStatus === filter);

  const handleAction = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      if (actionTarget.action === 'approve') {
        await teamService.approve(actionTarget.team.id);
        enqueueSnackbar('Equipe aprovada com sucesso.', { variant: 'success' });
      } else {
        await teamService.reject(actionTarget.team.id);
        enqueueSnackbar('Equipe reprovada.', { variant: 'success' });
      }
      setActionTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível processar a ação.', {
        variant: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Equipes" subtitle="Gerencie as inscrições das equipes do evento" />

      <Tabs
        value={filter}
        onChange={(_, v) => setFilter(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {FILTERS.map((f) => (
          <Tab key={f.value} label={f.label} value={f.value} />
        ))}
      </Tabs>

      <DataTable
        loading={loading}
        rows={filteredTeams}
        rowKey={(t) => t.id}
        emptyTitle="Nenhuma equipe encontrada"
        columns={[
          {
            key: 'name',
            header: 'Equipe',
            render: (t) => (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={t.logo ?? undefined} variant="rounded" sx={{ width: 32, height: 32 }} />
                <span>{t.name}</span>
              </Stack>
            ),
          },
          { key: 'players', header: 'Jogadores', render: (t) => `${playerCounts[t.id] ?? 0}/14` },
          { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.registrationStatus} /> },
          {
            key: 'actions',
            header: 'Ações',
            align: 'right',
            render: (t) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Visualizar">
                  <IconButton size="small" onClick={() => navigate(`/admin/teams/${t.id}`)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Aprovar">
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      disabled={t.registrationStatus === 'APPROVED'}
                      onClick={() => setActionTarget({ team: t, action: 'approve' })}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Reprovar">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={t.registrationStatus === 'REJECTED'}
                      onClick={() => setActionTarget({ team: t, action: 'reject' })}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget?.action === 'approve' ? 'Aprovar equipe' : 'Reprovar equipe'}
        description={`Confirma ${actionTarget?.action === 'approve' ? 'a aprovação' : 'a reprovação'} da equipe "${actionTarget?.team.name}"?`}
        confirmLabel="Confirmar"
        danger={actionTarget?.action === 'reject'}
        loading={processing}
        onConfirm={handleAction}
        onClose={() => setActionTarget(null)}
      />
    </Box>
  );
}
