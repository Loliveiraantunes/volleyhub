import { Box, Button, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={1} sx={{ py: 6, textAlign: 'center' }}>
      {icon ?? <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" maxWidth={360}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}

export function EmptyStateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="contained" onClick={onClick}>
      {label}
    </Button>
  );
}
