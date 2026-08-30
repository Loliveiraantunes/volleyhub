import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  label?: string;
  fullHeight?: boolean;
}

export function Loading({ label = 'Carregando...', fullHeight = true }: LoadingProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{ py: 6, minHeight: fullHeight ? '40vh' : undefined }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
