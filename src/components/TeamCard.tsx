import { Avatar, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import type { Team } from '../types/api';
import { StatusBadge } from './StatusBadge';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  const content = (
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={team.logo ?? undefined} variant="rounded">
          <GroupsIcon />
        </Avatar>
        <Stack flex={1} minWidth={0}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {team.name}
          </Typography>
          <StatusBadge status={team.registrationStatus} />
        </Stack>
      </Stack>
    </CardContent>
  );

  return (
    <Card variant="outlined">{onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}</Card>
  );
}
