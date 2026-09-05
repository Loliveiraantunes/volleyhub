import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { ImageUpload } from '../../components/ImageUpload';
import { PlayerForm } from '../../components/PlayerForm';
import { StaffForm } from '../../components/StaffForm';
import { Loading } from '../../components/Loading';
import { registrationService } from '../../services/registrationService';
import { publicEventService } from '../../services/eventService';
import type {
  Event,
  Registration,
  RegistrationPlayerRequest,
  RegistrationTechnicalStaffRequest,
} from '../../types/api';
import { formatCurrency, formatDate, staffRoleLabels } from '../../utils/format';

const STEPS = ['Equipe', 'Jogadores', 'Comissão Técnica', 'Pagamento', 'WhatsApp'];
const MAX_PLAYERS = 14;
const MAX_STAFF = 2;

export function RegistrationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const [teamName, setTeamName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [players, setPlayers] = useState<RegistrationPlayerRequest[]>([]);
  const [staff, setStaff] = useState<RegistrationTechnicalStaffRequest[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) publicEventService.findBySlug(slug).then(setEvent).finally(() => setLoadingEvent(false));
  }, [slug]);

  if (loadingEvent) return <Loading />;
  if (!event) return null;

  const canGoNextFromTeam = teamName.trim().length > 0;

  const submitRegistration = async () => {
    if (!slug) return;
    setSubmitting(true);
    try {
      const created = await registrationService.create(
        slug,
        {
          teamName,
          logo: null,
          players,
          technicalStaff: staff,
        },
        logoFile,
      );
      setRegistration(created);
      setActiveStep(3);
      enqueueSnackbar('Inscrição enviada com sucesso.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível enviar a inscrição.', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = async () => {
    if (!registration) return;
    setSubmitting(true);
    try {
      const updated = await registrationService.confirmPayment(registration.id);
      setRegistration(updated);
      setActiveStep(4);
      enqueueSnackbar('Pagamento confirmado. Agora envie a confirmação pelo WhatsApp.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível confirmar o pagamento.', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = () => {
    const message =
      registration?.whatsappMessage ??
      `Olá! Confirmo a inscrição da equipe "${teamName}" no evento "${event.name}". Código da inscrição: ${registration?.id ?? ''}`;
    const phone = (registration?.whatsappNumber ?? event.whatsappNumber ?? '').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const copyPixKey = async () => {
    const pixKey = registration?.pixKey ?? event.pixKey;
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      enqueueSnackbar('Chave PIX copiada para a área de transferência.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Não foi possível copiar a chave PIX.', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
        Inscrição — {event.name}
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, overflowX: 'auto' }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={700}>
              Dados da equipe
            </Typography>
            <TextField label="Nome da equipe" value={teamName} onChange={(e) => setTeamName(e.target.value)} fullWidth autoFocus />
            <ImageUpload label="Logo da equipe" onFileChange={setLogoFile} variant="circular" />
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" disabled={!canGoNextFromTeam} onClick={() => setActiveStep(1)}>
                Próximo
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                Jogadores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jogadores cadastrados: {players.length}/{MAX_PLAYERS}
              </Typography>
            </Stack>
            <List dense>
              {players.map((p, index) => (
                <ListItem
                  key={`${p.fullName}-${p.cpf ?? ''}-${p.birthDate ?? ''}`}
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => setPlayers((prev) => prev.filter((_, i) => i !== index))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{p.fullName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={p.fullName}
                    secondary={`CPF: ${p.cpf || '-'} • Nascimento: ${formatDate(p.birthDate)}`}
                  />
                </ListItem>
              ))}
            </List>
            {players.length < MAX_PLAYERS && (
              <PlayerForm
                onSubmit={(data) => {
                  setPlayers((prev) => [...prev, { fullName: data.fullName, cpf: data.cpf, birthDate: data.birthDate }]);
                }}
              />
            )}
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Voltar</Button>
              <Button variant="contained" disabled={players.length === 0} onClick={() => setActiveStep(2)}>
                Próximo
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                Comissão técnica
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {staff.length}/{MAX_STAFF}
              </Typography>
            </Stack>
            <List dense>
              {staff.map((s, index) => (
                <ListItem
                  key={`${s.fullName}-${s.role}`}
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => setStaff((prev) => prev.filter((_, i) => i !== index))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{s.fullName[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={s.fullName} secondary={staffRoleLabels[s.role]} />
                </ListItem>
              ))}
            </List>
            {staff.length < MAX_STAFF && <StaffForm onSubmit={(data) => setStaff((prev) => [...prev, data])} />}
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Button onClick={() => setActiveStep(1)}>Voltar</Button>
              <Button variant="contained" onClick={submitRegistration} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar inscrição'}
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 3 && registration && (
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Pagamento
            </Typography>
            <Alert severity="info">Realize o pagamento e confirme abaixo para prosseguir.</Alert>
            <Typography>
              <strong>Valor:</strong> {formatCurrency(registration.registrationPrice ?? event.registrationPrice)}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>
                <strong>Chave PIX:</strong> {registration.pixKey ?? event.pixKey ?? '-'}
              </Typography>
              {(registration.pixKey ?? event.pixKey) && (
                <IconButton size="small" onClick={copyPixKey} aria-label="Copiar chave PIX">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            <Typography>
              <strong>Recebedor:</strong> {registration.pixReceiverName ?? event.pixReceiverName ?? '-'}
            </Typography>
            {(registration.paymentInstructions ?? event.paymentInstructions) && (
              <Typography variant="body2" color="text.secondary">
                {registration.paymentInstructions ?? event.paymentInstructions}
              </Typography>
            )}
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={confirmPayment} disabled={submitting}>
                Já realizei o pagamento
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 4 && registration && (
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h6" fontWeight={700}>
              Quase lá!
            </Typography>
            <Typography color="text.secondary">
              Envie a confirmação da sua inscrição pelo WhatsApp para finalizar o processo.
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<WhatsAppIcon />}
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enviar confirmação pelo WhatsApp
            </Button>
            <Button onClick={() => navigate(`/event/${slug}`)}>Voltar ao evento</Button>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
