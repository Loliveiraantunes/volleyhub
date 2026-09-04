import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { MatchStatus, RegistrationStatus } from '../types/api';

type StatusValue = RegistrationStatus | MatchStatus;

const CONFIG: Record<string, { label: string; color: ChipProps['color'] }> = {
  AWAITING: { label: 'Aguardando', color: 'default' },
  PENDING: { label: 'Pendente', color: 'default' },
  PAYMENT_SENT: { label: 'Pagamento enviado', color: 'info' },
  UNDER_REVIEW: { label: 'Em análise', color: 'warning' },
  APPROVED: { label: 'Aprovada', color: 'success' },
  REJECTED: { label: 'Reprovada', color: 'error' },
  SCHEDULED: { label: 'Agendado', color: 'default' },
  IN_PROGRESS: { label: 'Em andamento', color: 'info' },
  FINISHED: { label: 'Finalizado', color: 'success' },
  CANCELLED: { label: 'Cancelado', color: 'error' },
};

export const StatusBadge = ({ status, size = 'small' }: Readonly<{ status: StatusValue; size?: ChipProps['size'] }>) => {
  const config = CONFIG[status] ?? { label: status, color: 'default' as const };
  return <Chip label={config.label} color={config.color} size={size} variant={config.color === 'default' ? 'outlined' : 'filled'} />;
};
