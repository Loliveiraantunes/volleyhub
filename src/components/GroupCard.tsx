import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import type { GroupStage, Team } from '../types/api';

interface GroupCardProps {
  group: GroupStage;
  teamsById: Map<number, Team>;
  onRename: () => void;
  onDelete: () => void;
  onRemoveTeam: (teamId: number) => void;
  onMoveTeam: (teamId: number, direction: 'up' | 'down') => void;
}

export function GroupCard({ group, teamsById, onRename, onDelete, onRemoveTeam, onMoveTeam }: GroupCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const sortedTeams = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <Card variant="outlined">
      <CardHeader
        title={group.name}
        action={
          <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onRename();
                }}
              >
                Renomear
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onDelete();
                }}
                sx={{ color: 'error.main' }}
              >
                Excluir
              </MenuItem>
            </Menu>
          </>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {sortedTeams.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma equipe neste grupo.
          </Typography>
        ) : (
          <List dense disablePadding>
            {sortedTeams.map((gt, index) => {
              const team = teamsById.get(gt.teamId);
              return (
                <ListItem
                  key={gt.teamId}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" disabled={index === 0} onClick={() => onMoveTeam(gt.teamId, 'up')}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === sortedTeams.length - 1}
                        onClick={() => onMoveTeam(gt.teamId, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => onRemoveTeam(gt.teamId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={team?.logo ?? undefined} variant="rounded" sx={{ width: 32, height: 32 }} />
                  </ListItemAvatar>
                  <ListItemText primary={team?.name ?? `Equipe #${gt.teamId}`} />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
