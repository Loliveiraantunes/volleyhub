import {
  Avatar,
  Box,
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

export function StandingsTable({ standings }: Readonly<StandingsTableProps>) {
  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2, bgcolor: 'primary.main' }}
      >
        <Box>
          <Typography color="primary.contrastText" fontWeight={800} variant="h6">
            {standings.groupName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            Ranking por pontos, vitórias e sets ganhos
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 700 }}>
          {standings.entries.length} equipes
        </Typography>
      </Stack>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="medium" sx={{ minWidth: 580 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#2f3137' }}>
              <TableCell width={64} sx={{ fontWeight: 800 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Equipe</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Vitórias</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Sets ganhos</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Pontos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.entries.map((entry) => (
              <TableRow key={entry.teamId} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#2f3137' } }}>
                <TableCell>
                  <Typography fontWeight={800} color={entry.position <= 3 ? 'primary.main' : 'text.primary'}>
                    {entry.position}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar src={entry.logo ?? undefined} sx={{ width: 34, height: 34 }} variant="rounded" />
                    <Typography variant="body1" fontWeight={700} noWrap sx={{ maxWidth: { xs: 180, md: 'none' } }}>
                      {entry.teamName}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={700}>{entry.wins ?? '—'}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={700}>{entry.setsWon ?? '—'}</Typography>
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
