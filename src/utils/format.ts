import dayjs from 'dayjs';

export function formatDate(date?: string | null): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
}

export function formatDateTime(date?: string | null): string {
  if (!date) return '-';
  return dayjs(date).format('DD/MM - HH:mm');
}

export function formatCurrency(value?: number | null): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function maskCpf(cpf?: string | null): string {
  if (!cpf) return '-';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export const genderLabels: Record<string, string> = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  MIXED: 'Misto',
};

export const staffRoleLabels: Record<string, string> = {
  COACH: 'Técnico',
  ASSISTANT: 'Assistente/Auxiliar',
};

export const matchStatusLabels: Record<string, string> = {
  AWAITING: 'Aguardando',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

export const matchStageLabels: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  'Group Stage': 'Fase de Grupos',
  QUARTERFINALS: 'Quartas de Finais',
  Quarterfinals: 'Quartas de Finais',
  SEMIFINALS: 'Semi-Finais',
  Semifinals: 'Semi-Finais',
  FINAL: 'Finais',
  Final: 'Finais',
};
