import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { GroupCard } from '../../components/GroupCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { groupService } from '../../services/groupService';
import { teamService } from '../../services/teamService';
import type { GroupStage, Team } from '../../types/api';

export function GroupsPage() {
  const { eventId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [groups, setGroups] = useState<GroupStage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupStage | null>(null);
  const [groupName, setGroupName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GroupStage | null>(null);
  const [addTeamDialog, setAddTeamDialog] = useState<GroupStage | null>(null);
  const [teamToAdd, setTeamToAdd] = useState<number | ''>('');

  const load = () => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([groupService.listByEvent(Number(eventId)), teamService.listByEvent(Number(eventId))])
      .then(([g, t]) => {
        setGroups(g);
        setTeams(t.filter((team) => team.registrationStatus === 'APPROVED'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const openCreate = () => {
    setEditingGroup(null);
    setGroupName('');
    setDialogOpen(true);
  };

  const openEdit = (group: GroupStage) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!eventId || !groupName.trim()) return;
    try {
      if (editingGroup) {
        await groupService.update(editingGroup.id, { name: groupName, displayOrder: editingGroup.displayOrder });
        enqueueSnackbar('Grupo renomeado.', { variant: 'success' });
      } else {
        await groupService.create(Number(eventId), { name: groupName, displayOrder: groups.length });
        enqueueSnackbar('Grupo criado.', { variant: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar o grupo.', {
        variant: 'error',
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    try {
      await groupService.remove(deleteTarget.id);
      enqueueSnackbar('Grupo excluído.', { variant: 'success' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível excluir o grupo.', {
        variant: 'error',
      });
    }
  };

  const handleAddTeam = async () => {
    if (!addTeamDialog || teamToAdd === '') return;
    try {
      await groupService.addTeam(addTeamDialog.id, Number(teamToAdd), addTeamDialog.teams.length);
      enqueueSnackbar('Equipe adicionada ao grupo.', { variant: 'success' });
      setAddTeamDialog(null);
      setTeamToAdd('');
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível adicionar a equipe.', {
        variant: 'error',
      });
    }
  };

  const handleRemoveTeam = async (group: GroupStage, teamId: number) => {
    try {
      await groupService.removeTeam(group.id, teamId);
      enqueueSnackbar('Equipe removida do grupo.', { variant: 'success' });
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível remover a equipe.', {
        variant: 'error',
      });
    }
  };

  const handleMoveTeam = async (group: GroupStage, teamId: number, direction: 'up' | 'down') => {
    const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((t) => t.teamId === teamId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    try {
      await Promise.all([
        groupService.addTeam(group.id, sorted[index].teamId, sorted[targetIndex].displayOrder),
        groupService.addTeam(group.id, sorted[targetIndex].teamId, sorted[index].displayOrder),
      ]);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível reordenar as equipes.', {
        variant: 'error',
      });
    }
  };

  const availableTeamsForDialog = addTeamDialog
    ? teams.filter((t) => !addTeamDialog.teams.some((gt) => gt.teamId === t.id))
    : [];

  return (
    <Box>
      <PageHeader
        title="Grupos"
        subtitle="Organize as equipes em grupos manualmente"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Novo grupo
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState title="Nenhum grupo criado" description="Crie o primeiro grupo para organizar as equipes." />
      ) : (
        <Grid container spacing={2}>
          {groups
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <Stack spacing={1}>
                  <GroupCard
                    group={group}
                    teamsById={teamsById}
                    onRename={() => openEdit(group)}
                    onDelete={() => setDeleteTarget(group)}
                    onRemoveTeam={(teamId) => handleRemoveTeam(group, teamId)}
                    onMoveTeam={(teamId, direction) => handleMoveTeam(group, teamId, direction)}
                  />
                  <Button size="small" onClick={() => setAddTeamDialog(group)}>
                    + Adicionar equipe
                  </Button>
                </Stack>
              </Grid>
            ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingGroup ? 'Renomear grupo' : 'Novo grupo'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome do grupo"
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveGroup} disabled={!groupName.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!addTeamDialog} onClose={() => setAddTeamDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adicionar equipe ao grupo {addTeamDialog?.name}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Equipe"
            fullWidth
            sx={{ mt: 1 }}
            value={teamToAdd}
            onChange={(e) => setTeamToAdd(Number(e.target.value))}
          >
            {availableTeamsForDialog.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddTeamDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddTeam} disabled={teamToAdd === ''}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir grupo"
        description={`Tem certeza que deseja excluir o grupo "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Excluir"
        onConfirm={handleDeleteGroup}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
