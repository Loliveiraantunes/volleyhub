import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: Readonly<PageHeaderProps>) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider', position: 'relative', '&::before': { content: '""', position: 'absolute', left: 0, bottom: -1, width: 56, height: 3, bgcolor: 'primary.main' } }}
    >
      <Box>
        <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: 0.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box>{actions}</Box>}
    </Stack>
  );
}
