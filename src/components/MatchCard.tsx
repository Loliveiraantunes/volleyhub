import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { Match } from '../types/api';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils/format';

interface MatchCardProps {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  onClick?: () => void;
}

export function MatchCard({ match, homeTeamName, awayTeamName, onClick }: MatchCardProps) {
  return (
    <Card variant="outlined" onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <StatusBadge status={match.status} />
          {match.court && (
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
              <PlaceIcon fontSize="small" />
              <Typography variant="caption">{match.court}</Typography>
            </Stack>
          )}
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body1" fontWeight={600} noWrap flex={1}>
            {homeTeamName}
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {match.homeSetsWon} × {match.awaySetsWon}
          </Typography>
          <Typography variant="body1" fontWeight={600} noWrap flex={1} textAlign="right">
            {awayTeamName}
          </Typography>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
          <ScheduleIcon fontSize="small" />
          <Typography variant="caption">{formatDateTime(match.scheduledAt)}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
