import { alpha } from '@mui/material/styles';
import { Avatar, Card, CardContent, Divider, IconButton, Stack, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import type { Match } from '../types/api';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/format';

interface MatchCardProps {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  onClick?: () => void;
  onEdit?: () => void;
}

const STAGE_LABELS = {
  GROUP_STAGE: 'Group Stage',
  QUARTERFINALS: 'Quarterfinals',
  SEMIFINALS: 'Semifinals',
  FINAL: 'Final',
} as const;

export function MatchCard({
  match,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  onClick,
  onEdit,
}: Readonly<MatchCardProps>) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        '&:hover': onClick ? {
          borderColor: 'primary.main',
          boxShadow: `0 8px 24px ${alpha('#1565c0', 0.14)}`,
          transform: 'translateY(-2px)',
        } : undefined,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack spacing={0.5}>
            <StatusBadge status={match.status} />
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {STAGE_LABELS[match.stage ?? 'GROUP_STAGE']}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
          <Stack alignItems="center" spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
            <Avatar src={homeTeamLogo ?? undefined} variant="rounded" sx={{ width: 52, height: 52 }} />
            <Typography variant="body1" fontWeight={800} textAlign="center" noWrap sx={{ maxWidth: '100%' }}>
              {homeTeamName}
            </Typography>
          </Stack>
          <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 72 }}>
            <Typography variant="h5" fontWeight={900} lineHeight={1.1}>
              {match.homeSetsWon} × {match.awaySetsWon}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Placar
            </Typography>
          </Stack>
          <Stack alignItems="center" spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
            <Avatar src={awayTeamLogo ?? undefined} variant="rounded" sx={{ width: 52, height: 52 }} />
            <Typography variant="body1" fontWeight={800} textAlign="center" noWrap sx={{ maxWidth: '100%' }}>
              {awayTeamName}
            </Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} color="text.secondary">
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <ScheduleIcon fontSize="small" />
              <Typography variant="caption" noWrap>
                {formatDateTime(match.scheduledAt)}
              </Typography>
            </Stack>
            {match.court && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                <PlaceIcon fontSize="small" />
                <Typography variant="caption" noWrap>{match.court}</Typography>
              </Stack>
            )}
          </Stack>
          {onEdit && (
            <IconButton
              size="small"
              color="primary"
              title="Editar data e local"
              onClick={(event) => { event.stopPropagation(); onEdit(); }}
              sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
