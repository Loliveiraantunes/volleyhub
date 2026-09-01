import { alpha } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRef, useState } from 'react';
import type { GroupStage, GroupStageTeam, Team } from '../types/api';

interface GroupCardProps {
  group: GroupStage;
  teamsById: Map<number, Team>;
  onRename: () => void;
  onDelete: () => void;
  onRemoveTeam: (teamId: number) => void;
  onMoveTeam: (teamId: number, direction: 'up' | 'down') => void;
  onTeamDragStart: (teamId: number) => void;
  onDropTeam: () => void;
}

interface SlotRowProps {
  gt: GroupStageTeam | null;
  team: Team | undefined;
  seedIndex: number;
  totalTeams: number;
  isTop: boolean;
  textColor: string;
  mutedColor: string;
  hoverBg: string;
  onMoveTeam: (teamId: number, direction: 'up' | 'down') => void;
  onRemoveTeam: (teamId: number) => void;
  onTeamDragStart: (teamId: number) => void;
}

// Matches the MatchRow style from BracketPage exactly
function SlotRow({
  gt,
  team,
  seedIndex,
  totalTeams,
  isTop,
  textColor,
  mutedColor,
  hoverBg,
  onMoveTeam,
  onRemoveTeam,
  onTeamDragStart,
}: Readonly<SlotRowProps>) {
  const accent = isTop ? '#4caf50' : '#ef5350';

  if (!gt) {
    return (
      <Box
        sx={{
          height: 44,
          px: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderLeft: `3px solid ${accent}`,
          bgcolor: isTop ? 'transparent' : 'rgba(0,0,0,0.03)',
        }}
      >
        <Avatar variant="rounded" sx={{ width: 22, height: 22, flexShrink: 0, bgcolor: 'action.hover' }} />
        <Typography noWrap sx={{ flex: 1, color: mutedColor, fontSize: 13, fontWeight: 700 }}>
          TBD
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      draggable
      onDragStart={(e) => { e.stopPropagation(); onTeamDragStart(gt.teamId); }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 44,
        pr: 0.5,
        borderLeft: `3px solid ${accent}`,
        bgcolor: isTop ? 'transparent' : 'rgba(0,0,0,0.03)',
        cursor: 'grab',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: hoverBg },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, px: 1.25, minWidth: 0 }}>
        <Avatar src={team?.logo ?? undefined} variant="rounded" sx={{ width: 22, height: 22, flexShrink: 0 }} />
        <Typography noWrap sx={{ flex: 1, color: textColor, fontSize: 13, fontWeight: 700 }}>
          {team?.name ?? `Equipe #${gt.teamId}`}
        </Typography>
      </Box>
      <Stack direction="row" sx={{ flexShrink: 0 }}>
        <IconButton size="small" disabled={seedIndex === 0} onClick={() => onMoveTeam(gt.teamId, 'up')}>
          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton size="small" disabled={seedIndex >= totalTeams - 1} onClick={() => onMoveTeam(gt.teamId, 'down')}>
          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onRemoveTeam(gt.teamId)}>
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Stack>
    </Box>
  );
}

export function GroupCard({
  group,
  teamsById,
  onRename,
  onDelete,
  onRemoveTeam,
  onMoveTeam,
  onTeamDragStart,
  onDropTeam,
}: Readonly<GroupCardProps>) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const sortedTeams = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);

  const surfaceSoft = alpha(theme.palette.primary.main, 0.04);
  const dragOverBg = alpha(theme.palette.primary.main, 0.08);
  const hoverBg = alpha(theme.palette.primary.main, 0.06);
  const dividerColor = theme.palette.divider;
  const textColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;

  // Group teams into adjacent pairs: [seed0, seed1], [seed2, seed3], ...
  const pairs: Array<[GroupStageTeam, GroupStageTeam | null]> = [];
  for (let i = 0; i < sortedTeams.length; i += 2) {
    pairs.push([sortedTeams[i], sortedTeams[i + 1] ?? null]);
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderColor: isDragOver ? 'primary.main' : dividerColor,
        borderStyle: isDragOver ? 'dashed' : 'solid',
        transition: 'border-color 0.15s',
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => { dragCounter.current += 1; setIsDragOver(true); }}
      onDragLeave={() => { dragCounter.current -= 1; if (dragCounter.current === 0) setIsDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; setIsDragOver(false); onDropTeam(); }}
    >
      {/* Header — mirrors GroupBracket header in BracketPage */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: isDragOver ? dragOverBg : surfaceSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${dividerColor}`,
          transition: 'background-color 0.15s',
          userSelect: 'none',
        }}
      >
        <Typography sx={{ color: textColor, fontWeight: 800, fontSize: 15 }}>
          {group.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: mutedColor }}>
            {sortedTeams.length} equipe{sortedTeams.length !== 1 ? 's' : ''}
          </Typography>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: mutedColor, p: 0.5 }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setAnchorEl(null); onRename(); }}>Renomear</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); onDelete(); }} sx={{ color: 'error.main' }}>Excluir</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Match-pair cards — same visual as BracketMatchCard */}
      <Box sx={{ bgcolor: theme.palette.background.default, p: 2.5 }}>
        {pairs.length === 0 ? (
          <Box sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: isDragOver ? 'primary.main' : mutedColor, fontStyle: 'italic', fontSize: 13 }}
            >
              {isDragOver ? 'Solte aqui para adicionar' : 'Arraste equipes para montar os confrontos'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {pairs.map(([home, away], pairIndex) => {
              const homeTeam = teamsById.get(home.teamId);
              const awayTeam = away ? teamsById.get(away.teamId) : undefined;
              const homeIdx = pairIndex * 2;
              const awayIdx = homeIdx + 1;
              return (
                <Box
                  key={home.teamId}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${dividerColor}`,
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  <SlotRow
                    gt={home} team={homeTeam} seedIndex={homeIdx} totalTeams={sortedTeams.length}
                    isTop textColor={textColor} mutedColor={mutedColor} hoverBg={hoverBg}
                    onMoveTeam={onMoveTeam} onRemoveTeam={onRemoveTeam} onTeamDragStart={onTeamDragStart}
                  />
                  <Divider sx={{ borderColor: dividerColor }} />
                  <SlotRow
                    gt={away ?? null} team={awayTeam} seedIndex={awayIdx} totalTeams={sortedTeams.length}
                    isTop={false} textColor={textColor} mutedColor={mutedColor} hoverBg={hoverBg}
                    onMoveTeam={onMoveTeam} onRemoveTeam={onRemoveTeam} onTeamDragStart={onTeamDragStart}
                  />
                </Box>
              );
            })}
            {isDragOver && (
              <Box
                sx={{
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: dragOverBg,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="caption" color="primary">
                  Solte para adicionar ao final
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
