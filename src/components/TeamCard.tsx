import { Avatar, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Team } from '../types/api';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export function TeamCard({ team, onClick }: Readonly<TeamCardProps>) {
  const content = (
    <CardContent sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={team.logo ?? undefined}
          variant="rounded"
          sx={{ width: 56, height: 56, bgcolor: '#3f4248', border: '1px solid', borderColor: 'divider' }}
        >
          <GroupsIcon />
        </Avatar>
        <Stack flex={1} minWidth={0} spacing={0.4}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {team.name}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'success.main' }}>
            <CheckCircleIcon sx={{ fontSize: 15 }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Equipe confirmada
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        ...(onClick && {
          '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' },
        }),
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
