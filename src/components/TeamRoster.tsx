import { Alert, Avatar, Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import type { TeamDetailResponse } from '../types/api';
import { staffRoleLabels } from '../utils/format';

export function TeamRoster({ team }: Readonly<{ team: TeamDetailResponse }>) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Avatar src={team.teamLogo ?? undefined} variant="rounded" sx={{ width: 36, height: 36 }}>
          <GroupsIcon fontSize="small" />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800}>{team.teamName}</Typography>
      </Stack>

      {team.players.length > 0 ? (
        <>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
          >
            Jogadores ({team.players.length})
          </Typography>
          <Stack spacing={0.25}>
            {team.players.map((player) => (
              <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75, borderRadius: 1 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main', flexShrink: 0 }}>
                  {player.fullName[0]}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>{player.fullName}</Typography>
              </Box>
            ))}
          </Stack>
        </>
      ) : (
        <Alert severity="info">Jogadores não disponíveis para esta equipe.</Alert>
      )}

      {team.technicalStaff.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
          >
            Comissão técnica
          </Typography>
          <Stack spacing={0.25}>
            {team.technicalStaff.map((member) => (
              <Box
                key={member.id}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1, py: 0.75, borderRadius: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main', flexShrink: 0 }}>
                    {member.fullName[0]}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{member.fullName}</Typography>
                </Stack>
                <Chip label={staffRoleLabels[member.role as keyof typeof staffRoleLabels]} size="small" variant="outlined" />
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
