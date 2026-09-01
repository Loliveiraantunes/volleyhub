import React, { useEffect, useMemo, useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { GroupCard } from '../../components/GroupCard';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { groupService } from '../../services/groupService';
import { matchService } from '../../services/matchService';
import { teamService } from '../../services/teamService';
import type { GroupStage, Match, Team } from '../../types/api';
import { formatDateTime } from '../../utils/format';

interface PendingPair {
  key: string;
  groupId: number;
  groupName: string;
  homeTeamId: number;
  homeName: string;
  awayTeamId: number;
  awayName: string;
  date: string;
  time: string;
  court: string;
}

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
  const [draggedTeamId, setDraggedTeamId] = useState<number | null>(null);
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [pendingPairs, setPendingPairs] = useState<PendingPair[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [deleteMatchTarget, setDeleteMatchTarget] = useState<number | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editMatchData, setEditMatchData] = useState({
    groupId: '' as number | '',
    homeTeamId: '' as number | '',
    awayTeamId: '' as number | '',
    scheduledAt: '',
    court: '',
  });
  const [savingMatch, setSavingMatch] = useState(false);
  const [summaryMatch, setSummaryMatch] = useState<Match | null>(null);
  const [summarySets, setSummarySets] = useState<Array<{ setNumber: number; homePoints: number; awayPoints: number }>>([]);
  const [savingSummary, setSavingSummary] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  const load = () => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([
      groupService.listByEvent(Number(eventId)),
      teamService.listByEvent(Number(eventId)),
      matchService.listByEvent(Number(eventId)),
    ])
      .then(([g, t, m]) => {
        setGroups(g);
        setTeams(t.filter((team) => team.registrationStatus === 'APPROVED'));
        setMatches(m);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // maps each assigned teamId to its current group
  const groupByTeamId = useMemo(() => {
    const map = new Map<number, GroupStage>();
    groups.forEach((g) => g.teams.forEach((t) => map.set(t.teamId, g)));
    return map;
  }, [groups]);

  const ungroupedTeams = useMemo(
    () => teams.filter((t) => !groupByTeamId.has(t.id)),
    [teams, groupByTeamId],
  );

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

  const handleDropTeam = async (targetGroup: GroupStage) => {
    if (draggedTeamId === null) return;
    const sourceGroup = groupByTeamId.get(draggedTeamId);
    if (sourceGroup?.id === targetGroup.id) return;
    try {
      if (sourceGroup) {
        await groupService.removeTeam(sourceGroup.id, draggedTeamId);
      }
      await groupService.addTeam(targetGroup.id, draggedTeamId, targetGroup.teams.length);
      enqueueSnackbar('Equipe movida.', { variant: 'success' });
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível mover a equipe.', {
        variant: 'error',
      });
    } finally {
      setDraggedTeamId(null);
    }
  };

  const generateGroupMatches = async () => {
    if (!eventId) return;
    setGeneratingMatches(true);
    try {
      const existing = await matchService.listByEvent(Number(eventId));
      // groups that already have any match are skipped to avoid conflicting with bracket matches
      const groupsWithMatches = new Set(existing.filter((m) => m.groupId != null).map((m) => m.groupId));
      const existingKeys = new Set(
        existing
          .filter((m) => m.groupId != null)
          .map((m) => `${m.groupId}:${Math.min(m.homeTeamId, m.awayTeamId)}:${Math.max(m.homeTeamId, m.awayTeamId)}`),
      );
      const today = dayjs().format('YYYY-MM-DD');
      const pairs: PendingPair[] = [];
      for (const group of groups) {
        if (groupsWithMatches.has(group.id)) continue;
        const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
        for (let i = 0; i + 1 < sorted.length; i += 2) {
          const home = sorted[i].teamId;
          const away = sorted[i + 1].teamId;
          const key = `${group.id}:${Math.min(home, away)}:${Math.max(home, away)}`;
          if (existingKeys.has(key)) continue;
          pairs.push({
            key,
            groupId: group.id,
            groupName: group.name,
            homeTeamId: home,
            homeName: teamsById.get(home)?.name ?? `Equipe #${home}`,
            awayTeamId: away,
            awayName: teamsById.get(away)?.name ?? `Equipe #${away}`,
            date: today,
            time: '',
            court: '',
          });
        }
      }
      if (pairs.length === 0) {
        enqueueSnackbar(
          groupsWithMatches.size > 0
            ? 'Os grupos já possuem confrontos. Exclua os incorretos e gere novamente se necessário.'
            : 'Nenhum confronto novo necessário.',
          { variant: 'info' },
        );
        return;
      }
      setPendingPairs(pairs);
      setGenerateDialogOpen(true);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível verificar os confrontos.', {
        variant: 'error',
      });
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (deleteMatchTarget === null) return;
    try {
      await matchService.remove(deleteMatchTarget);
      setMatches((prev) => prev.filter((m) => m.id !== deleteMatchTarget));
      enqueueSnackbar('Confronto excluído.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível excluir o confronto.', {
        variant: 'error',
      });
    } finally {
      setDeleteMatchTarget(null);
    }
  };

  const openEditMatch = (match: Match) => {
    setEditingMatch(match);
    setEditMatchData({
      groupId: match.groupId ?? '',
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      scheduledAt: match.scheduledAt ? dayjs(match.scheduledAt).format('YYYY-MM-DDTHH:mm') : '',
      court: match.court ?? '',
    });
  };

  const updateEditMatchData = (field: keyof typeof editMatchData, value: string | number) => {
    setEditMatchData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveMatch = async () => {
    if (!editingMatch || editMatchData.homeTeamId === '' || editMatchData.awayTeamId === '') return;
    if (editMatchData.homeTeamId === editMatchData.awayTeamId) {
      enqueueSnackbar('As equipes do confronto devem ser diferentes.', { variant: 'warning' });
      return;
    }

    setSavingMatch(true);
    try {
      const updated = await matchService.update(editingMatch.id, {
        groupId: editMatchData.groupId === '' ? null : editMatchData.groupId,
        homeTeamId: editMatchData.homeTeamId,
        awayTeamId: editMatchData.awayTeamId,
        scheduledAt: editMatchData.scheduledAt ? dayjs(editMatchData.scheduledAt).toISOString() : null,
        court: editMatchData.court || null,
        status: editingMatch.status,
        sets: editingMatch.sets.map((set) => ({
          setNumber: set.setNumber,
          homePoints: set.homePoints,
          awayPoints: set.awayPoints,
        })),
      });
      setMatches((prev) => prev.map((match) => (match.id === updated.id ? updated : match)));
      setEditingMatch(null);
      enqueueSnackbar('Confronto atualizado.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível atualizar o confronto.', {
        variant: 'error',
      });
    } finally {
      setSavingMatch(false);
    }
  };

  const openSummary = (match: Match) => {
    setSummaryMatch(match);
    setSummarySets(match.sets.map((s) => ({ setNumber: s.setNumber, homePoints: s.homePoints, awayPoints: s.awayPoints })));
  };

  const addSummarySet = () => {
    setSummarySets((prev) => [...prev, { setNumber: prev.length + 1, homePoints: 0, awayPoints: 0 }]);
  };

  const removeSummarySet = (index: number) => {
    setSummarySets((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 })));
  };

  const updateSummarySet = (index: number, field: 'homePoints' | 'awayPoints', value: number) => {
    setSummarySets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSaveSummary = async () => {
    if (!summaryMatch) return;
    setSavingSummary(true);
    try {
      const updated = await matchService.update(summaryMatch.id, {
        groupId: summaryMatch.groupId,
        homeTeamId: summaryMatch.homeTeamId,
        awayTeamId: summaryMatch.awayTeamId,
        scheduledAt: summaryMatch.scheduledAt,
        court: summaryMatch.court,
        status: summaryMatch.status === 'SCHEDULED' && summarySets.length > 0 ? 'IN_PROGRESS' : summaryMatch.status,
        sets: summarySets,
      });
      setSummaryMatch(updated);
      setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      enqueueSnackbar('Súmula salva.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar a súmula.', { variant: 'error' });
    } finally {
      setSavingSummary(false);
    }
  };

  const handleFinalizeSummary = async () => {
    if (!summaryMatch) return;
    setSavingSummary(true);
    try {
      const updated = await matchService.update(summaryMatch.id, {
        groupId: summaryMatch.groupId,
        homeTeamId: summaryMatch.homeTeamId,
        awayTeamId: summaryMatch.awayTeamId,
        scheduledAt: summaryMatch.scheduledAt,
        court: summaryMatch.court,
        status: 'FINISHED',
        sets: summarySets,
      });
      setSummaryMatch(updated);
      setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setConfirmFinalizeOpen(false);
      enqueueSnackbar('Súmula finalizada. Classificação e resultado atualizados.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível finalizar a súmula.', { variant: 'error' });
    } finally {
      setSavingSummary(false);
    }
  };

  const updatePendingPair = (key: string, field: 'date' | 'time' | 'court', value: string) => {
    setPendingPairs((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  };

  const confirmGenerateMatches = async () => {
    if (!eventId) return;
    setConfirming(true);
    try {
      for (const pair of pendingPairs) {
        const scheduledAt = pair.time
          ? dayjs(`${pair.date}T${pair.time}`).toISOString()
          : `${pair.date}T00:00:00.000Z`;
        await matchService.create(Number(eventId), {
          groupId: pair.groupId,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          scheduledAt,
          court: pair.court || null,
          status: 'SCHEDULED',
          sets: [],
        });
      }
      enqueueSnackbar(`${pendingPairs.length} confronto(s) gerado(s).`, { variant: 'success' });
      setGenerateDialogOpen(false);
      const updated = await matchService.listByEvent(Number(eventId));
      setMatches(updated);
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível gerar os confrontos.', {
        variant: 'error',
      });
    } finally {
      setConfirming(false);
    }
  };

  const availableTeamsForDialog = addTeamDialog
    ? teams.filter((t) => !addTeamDialog.teams.some((gt) => gt.teamId === t.id))
    : [];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const theme = useTheme();
  const poolHoverBg = alpha(theme.palette.primary.main, 0.06);
  const poolDivider = theme.palette.divider;

  let poolContent: React.ReactNode = null;
  if (!loading) {
    poolContent =
      ungroupedTeams.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          Todas as equipes aprovadas já estão distribuídas nos grupos.
        </Typography>
      ) : (
        <Box>
          {ungroupedTeams.map((team, index) => (
            <Box key={team.id}>
              <Box
                draggable
                onDragStart={() => setDraggedTeamId(team.id)}
                onDragEnd={() => setDraggedTeamId(null)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 44,
                  px: 1.25,
                  gap: 1,
                  borderLeft: '3px solid',
                  borderLeftColor: 'primary.main',
                  bgcolor: 'background.paper',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: poolHoverBg },
                  '&:active': { cursor: 'grabbing' },
                }}
              >
                <Avatar src={team.logo ?? undefined} variant="rounded" sx={{ width: 22, height: 22, flexShrink: 0 }} />
                <Typography noWrap sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
                  {team.name}
                </Typography>
              </Box>
              {index < ungroupedTeams.length - 1 && <Divider sx={{ borderColor: poolDivider }} />}
            </Box>
          ))}
        </Box>
      );
  }

  let groupsContent: React.ReactNode;
  if (loading) {
    groupsContent = <Loading />;
  } else if (groups.length === 0) {
    groupsContent = <EmptyState title="Nenhum grupo criado" description="Crie o primeiro grupo para organizar as equipes." />;
  } else {
    groupsContent = (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {[...groups]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((group) => (
            <Box key={group.id} sx={{ flex: '1 1 280px', minWidth: 0 }}>
              <Stack spacing={1}>
                <GroupCard
                  group={group}
                  teamsById={teamsById}
                  onRename={() => openEdit(group)}
                  onDelete={() => setDeleteTarget(group)}
                  onRemoveTeam={(teamId) => handleRemoveTeam(group, teamId)}
                  onMoveTeam={(teamId, direction) => handleMoveTeam(group, teamId, direction)}
                  onTeamDragStart={(teamId) => setDraggedTeamId(teamId)}
                  onDropTeam={() => handleDropTeam(group)}
                />
                <Button size="small" onClick={() => setAddTeamDialog(group)}>
                  + Adicionar equipe
                </Button>
              </Stack>
            </Box>
          ))}
      </Box>
    );
  }

  let matchesContent: React.ReactNode = null;
  if (!loading && matches.length > 0) {
    const sortedGroupsForMatches = [...groups].sort((a, b) => a.displayOrder - b.displayOrder);
    matchesContent = (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Confrontos
        </Typography>
        <Stack spacing={1.5}>
          {sortedGroupsForMatches.map((group) => {
            const groupMatches = matches
              .filter((m) => m.groupId === group.id)
              .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
            if (groupMatches.length === 0) return null;
            return (
              <Paper
                key={group.id}
                variant="outlined"
                sx={{ overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 15 }}>{group.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {groupMatches.length} confronto{groupMatches.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'background.default', p: 2 }}>
                  <Stack spacing={1}>
                    {groupMatches.map((match) => {
                      const homeTeam = teamsById.get(match.homeTeamId);
                      const awayTeam = teamsById.get(match.awayTeamId);
                      return (
                        <Box
                          key={match.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.25,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                            bgcolor: 'background.paper',
                            transition: 'border-color 0.15s, box-shadow 0.15s',
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.3),
                              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.06)}`,
                            },
                          }}
                        >
                          <Box sx={{ flexShrink: 0 }}>
                            <StatusBadge status={match.status} />
                          </Box>

                          <Stack direction="row" alignItems="center" spacing={1} flex={1} justifyContent="flex-end" sx={{ minWidth: 0 }}>
                            <Typography noWrap fontWeight={700} variant="body2">
                              {homeTeam?.name ?? `Equipe #${match.homeTeamId}`}
                            </Typography>
                            <Avatar src={homeTeam?.logo ?? undefined} variant="rounded" sx={{ width: 28, height: 28, flexShrink: 0 }} />
                          </Stack>

                          <Box sx={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
                            <Typography variant="h6" fontWeight={900} lineHeight={1}>
                              {match.homeSetsWon}
                              <Typography component="span" color="text.disabled" sx={{ mx: 0.5, fontWeight: 400 }}>×</Typography>
                              {match.awaySetsWon}
                            </Typography>
                          </Box>

                          <Stack direction="row" alignItems="center" spacing={1} flex={1} sx={{ minWidth: 0 }}>
                            <Avatar src={awayTeam?.logo ?? undefined} variant="rounded" sx={{ width: 28, height: 28, flexShrink: 0 }} />
                            <Typography noWrap fontWeight={700} variant="body2">
                              {awayTeam?.name ?? `Equipe #${match.awayTeamId}`}
                            </Typography>
                          </Stack>

                          {(match.scheduledAt || match.court) && (
                            <Stack sx={{ flexShrink: 0, minWidth: 110, display: { xs: 'none', md: 'flex' } }} alignItems="flex-end">
                              {match.scheduledAt && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {formatDateTime(match.scheduledAt)}
                                </Typography>
                              )}
                              {match.court && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {match.court}
                                </Typography>
                              )}
                            </Stack>
                          )}

                          <Stack direction="row" spacing={0.25} flexShrink={0}>
                            <IconButton size="small" color="info" title="Súmula" onClick={() => openSummary(match)}>
                              <AssignmentIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary" title="Editar confronto" onClick={() => openEditMatch(match)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" title="Excluir confronto" onClick={() => setDeleteMatchTarget(match.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Grupos"
        subtitle="Arraste as equipes para montar os grupos e gere os confrontos ao concluir"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
              Novo grupo
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={generateGroupMatches}
              disabled={generatingMatches || groups.length === 0}
            >
              {generatingMatches ? 'Verificando...' : 'Gerar confrontos'}
            </Button>
          </Stack>
        }
      />

      {/* Pool — same Paper+header visual as GroupBracket in BracketPage */}
      <Paper
        variant="outlined"
        sx={{ overflow: 'hidden', mb: 3 }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'text.primary' }}>
            Equipes disponíveis
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Arraste para um grupo
          </Typography>
        </Box>
        <Box sx={{ bgcolor: 'background.default', p: ungroupedTeams.length === 0 || loading ? 2 : 0 }}>
          {poolContent}
        </Box>
      </Paper>

      {groupsContent}

      {matchesContent}

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

      {/* Generate matches — collect date/time/court per pair before creating */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => !confirming && setGenerateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Configurar confrontos</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 0.5 }}>
            {Object.entries(
              pendingPairs.reduce<Record<string, PendingPair[]>>((acc, p) => {
                if (!acc[p.groupName]) acc[p.groupName] = [];
                acc[p.groupName].push(p);
                return acc;
              }, {}),
            ).map(([groupName, pairs]) => (
              <Box key={groupName}>
                <Typography
                  sx={{
                    mb: 1.5,
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {groupName}
                </Typography>
                <Stack spacing={2}>
                  {pairs.map((pair) => (
                    <Box
                      key={pair.key}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                        sx={{ flex: '1 1 180px', minWidth: 0 }}
                      >
                        {pair.homeName}{' '}
                        <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                          ×
                        </Typography>{' '}
                        {pair.awayName}
                      </Typography>
                      <TextField
                        label="Data"
                        type="date"
                        size="small"
                        value={pair.date}
                        onChange={(e) => updatePendingPair(pair.key, 'date', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: '0 0 155px' }}
                      />
                      <TextField
                        label="Horário"
                        type="time"
                        size="small"
                        value={pair.time}
                        onChange={(e) => updatePendingPair(pair.key, 'time', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 300 } }}
                        sx={{ flex: '0 0 130px' }}
                      />
                      <TextField
                        label="Local"
                        size="small"
                        placeholder="Opcional"
                        value={pair.court}
                        onChange={(e) => updatePendingPair(pair.key, 'court', e.target.value)}
                        sx={{ flex: '1 1 160px' }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} disabled={confirming}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckIcon />}
            onClick={confirmGenerateMatches}
            disabled={confirming}
          >
            {confirming ? 'Gerando...' : `Gerar ${pendingPairs.length} confronto(s)`}
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

      <Dialog open={!!editingMatch} onClose={() => !savingMatch && setEditingMatch(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar confronto</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select
              label="Grupo"
              fullWidth
              value={editMatchData.groupId}
              onChange={(e) => updateEditMatchData('groupId', e.target.value === '' ? '' : Number(e.target.value))}
            >
              <MenuItem value="">Sem grupo</MenuItem>
              {[...groups]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Equipe A"
                fullWidth
                value={editMatchData.homeTeamId}
                onChange={(e) => updateEditMatchData('homeTeamId', Number(e.target.value))}
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Equipe B"
                fullWidth
                value={editMatchData.awayTeamId}
                onChange={(e) => updateEditMatchData('awayTeamId', Number(e.target.value))}
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Data e horário"
                type="datetime-local"
                fullWidth
                value={editMatchData.scheduledAt}
                onChange={(e) => updateEditMatchData('scheduledAt', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Local"
                fullWidth
                value={editMatchData.court}
                onChange={(e) => updateEditMatchData('court', e.target.value)}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingMatch(null)} disabled={savingMatch}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveMatch}
            disabled={
              savingMatch ||
              editMatchData.homeTeamId === '' ||
              editMatchData.awayTeamId === '' ||
              editMatchData.homeTeamId === editMatchData.awayTeamId
            }
          >
            {savingMatch ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!summaryMatch}
        onClose={() => !savingSummary && setSummaryMatch(null)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Súmula</span>
            {summaryMatch && (
              <StatusBadge status={summaryMatch.status} />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {summaryMatch && (() => {
            const homeTeam = teamsById.get(summaryMatch.homeTeamId);
            const awayTeam = teamsById.get(summaryMatch.awayTeamId);
            const homeSetsWon = summarySets.filter((s) => s.homePoints > s.awayPoints).length;
            const awaySetsWon = summarySets.filter((s) => s.awayPoints > s.homePoints).length;
            return (
              <Stack spacing={3} sx={{ pt: 0.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                  <Stack alignItems="center" spacing={0.5} flex={1}>
                    <Avatar src={homeTeam?.logo ?? undefined} variant="rounded" sx={{ width: 44, height: 44 }} />
                    <Typography fontWeight={700} textAlign="center" variant="body2">
                      {homeTeam?.name ?? `Equipe #${summaryMatch.homeTeamId}`}
                    </Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={900}>
                    {homeSetsWon} × {awaySetsWon}
                  </Typography>
                  <Stack alignItems="center" spacing={0.5} flex={1}>
                    <Avatar src={awayTeam?.logo ?? undefined} variant="rounded" sx={{ width: 44, height: 44 }} />
                    <Typography fontWeight={700} textAlign="center" variant="body2">
                      {awayTeam?.name ?? `Equipe #${summaryMatch.awayTeamId}`}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack spacing={1.5}>
                  {summarySets.map((set, index) => (
                    <Stack key={set.setNumber} direction="row" spacing={1.5} alignItems="center">
                      <Typography fontWeight={700} sx={{ minWidth: 48 }}>Set {set.setNumber}</Typography>
                      <TextField
                        type="number"
                        label={homeTeam?.name ?? 'Casa'}
                        size="small"
                        value={set.homePoints}
                        onChange={(e) => updateSummarySet(index, 'homePoints', Math.max(0, Number(e.target.value)))}
                        sx={{ flex: 1 }}
                        slotProps={{ htmlInput: { min: 0 } }}
                      />
                      <TextField
                        type="number"
                        label={awayTeam?.name ?? 'Fora'}
                        size="small"
                        value={set.awayPoints}
                        onChange={(e) => updateSummarySet(index, 'awayPoints', Math.max(0, Number(e.target.value)))}
                        sx={{ flex: 1 }}
                        slotProps={{ htmlInput: { min: 0 } }}
                      />
                      <IconButton size="small" color="error" onClick={() => removeSummarySet(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>

                <Button startIcon={<AddIcon />} onClick={addSummarySet} size="small" sx={{ alignSelf: 'flex-start' }}>
                  Adicionar set
                </Button>
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSummaryMatch(null)} disabled={savingSummary}>
            Fechar
          </Button>
          <Button variant="outlined" onClick={handleSaveSummary} disabled={savingSummary}>
            {savingSummary ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => setConfirmFinalizeOpen(true)}
            disabled={savingSummary || summarySets.length === 0}
          >
            Finalizar súmula
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmFinalizeOpen}
        title="Finalizar súmula"
        description="Após finalizar, o resultado será registrado e a classificação será atualizada. Deseja continuar?"
        confirmLabel="Finalizar"
        loading={savingSummary}
        onConfirm={handleFinalizeSummary}
        onClose={() => setConfirmFinalizeOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir grupo"
        description={`Tem certeza que deseja excluir o grupo "${deleteTarget?.name}"?`}
        danger
        confirmLabel="Excluir"
        onConfirm={handleDeleteGroup}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deleteMatchTarget !== null}
        title="Excluir confronto"
        description="Tem certeza que deseja excluir este confronto? Esta ação não pode ser desfeita."
        danger
        confirmLabel="Excluir"
        onConfirm={handleDeleteMatch}
        onClose={() => setDeleteMatchTarget(null)}
      />
    </Box>
  );
}
