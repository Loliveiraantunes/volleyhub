import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { Loading } from './Loading';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  onRowClick,
}: Readonly<DataTableProps<T>>) {
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', overflowX: 'auto', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)' }}>
      <Table size="medium" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#2f3137' }}>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align} width={col.width} sx={{ fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap' }}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              hover={!!onRowClick}
              onClick={() => onRowClick?.(row)}
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                '&:nth-of-type(even)': { bgcolor: '#2f3137' },
                '&:hover': { bgcolor: 'rgba(230,57,70,0.1) !important' },
              }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align}>
                  <Box component="span">{col.render(row)}</Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
