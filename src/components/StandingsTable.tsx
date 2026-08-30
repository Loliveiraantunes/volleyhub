import {
  Avatar,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { GroupStandings } from '../types/api';

interface StandingsTableProps {
  standings: GroupStandings;
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Stack sx={{ p: 2, bgcolor: 'primary.main' }}>
        <Typography color="primary.contrastText" fontWeight={700}>
          {standings.groupName}
        </Typography>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 360 }}>
          <TableHead>
            <TableRow>
              <TableCell width={48}>#</TableCell>
              <TableCell>Equipe</TableCell>
              <TableCell align="right">Pontos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.entries.map((entry) => (
              <TableRow key={entry.teamId}>
                <TableCell>{entry.position}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={entry.logo ?? undefined} sx={{ width: 24, height: 24 }} variant="rounded" />
                    <Typography variant="body2" noWrap>
                      {entry.teamName}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{entry.points}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
