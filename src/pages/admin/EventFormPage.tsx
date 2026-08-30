import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { ImageUpload } from '../../components/ImageUpload';
import { RichTextEditor } from '../../components/RichTextEditor';
import { eventService } from '../../services/eventService';
import { eventCategoryService } from '../../services/eventCategoryService';
import type { EventCategory, EventRequest } from '../../types/api';

const schema = z.object({
  name: z.string().min(1, 'Informe o nome do evento'),
  gender: z.enum(['FEMALE', 'MALE', 'MIXED']),
  categoryId: z.number({ invalid_type_error: 'Selecione uma categoria' }),
  description: z.string().nullable().optional(),
  regulation: z.string().nullable().optional(),
  registrationGuide: z.string().nullable().optional(),
  registrationStartAt: z.string().nullable().optional(),
  registrationEndAt: z.string().nullable().optional(),
  registrationOpen: z.boolean(),
  pixKey: z.string().nullable().optional(),
  pixReceiverName: z.string().nullable().optional(),
  registrationPrice: z.number().nullable().optional(),
  paymentInstructions: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DDTHH:mm');
}

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      gender: 'MIXED',
      categoryId: undefined,
      description: '',
      regulation: '',
      registrationGuide: '',
      registrationStartAt: '',
      registrationEndAt: '',
      registrationOpen: true,
      pixKey: '',
      pixReceiverName: '',
      registrationPrice: null,
      paymentInstructions: '',
      whatsappNumber: '',
    },
  });

  useEffect(() => {
    eventCategoryService.findAll().then(setCategories);
  }, []);

  useEffect(() => {
    if (!id) return;
    eventService.findById(Number(id)).then((event) => {
      reset({
        ...event,
        registrationStartAt: toDateTimeLocal(event.registrationStartAt),
        registrationEndAt: toDateTimeLocal(event.registrationEndAt),
      });
      setExistingCoverImage(event.coverImage ?? null);
      setLoading(false);
    });
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const payload: EventRequest = {
      ...data,
      coverImage: existingCoverImage,
      registrationStartAt: data.registrationStartAt ? dayjs(data.registrationStartAt).toISOString() : null,
      registrationEndAt: data.registrationEndAt ? dayjs(data.registrationEndAt).toISOString() : null,
    };
    try {
      if (isEdit) {
        await eventService.update(Number(id), payload, coverImageFile);
        enqueueSnackbar('Evento atualizado.', { variant: 'success' });
      } else {
        await eventService.create(payload, coverImageFile);
        enqueueSnackbar('Evento criado com sucesso.', { variant: 'success' });
      }
      navigate('/admin/events');
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar os dados.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader title={isEdit ? 'Editar evento' : 'Novo evento'} />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={700}>
                Informações gerais
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome do evento"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register('name')}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <TextField select label="Naipe" fullWidth {...field}>
                    <MenuItem value="MALE">Masculino</MenuItem>
                    <MenuItem value="FEMALE">Feminino</MenuItem>
                    <MenuItem value="MIXED">Misto</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Categoria"
                    fullWidth
                    error={!!errors.categoryId}
                    helperText={errors.categoryId?.message}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <ImageUpload
                label="Foto de capa"
                existingImageUrl={existingCoverImage}
                onFileChange={(file) => {
                  setCoverImageFile(file);
                  if (file) setExistingCoverImage(null);
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Conteúdo
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor label="Descrição" value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="regulation"
                control={control}
                render={({ field }) => (
                  <RichTextEditor label="Regulamento" value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="registrationGuide"
                control={control}
                render={({ field }) => (
                  <RichTextEditor label="Guia de inscrição" value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Inscrições
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Início das inscrições"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('registrationStartAt')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Fim das inscrições"
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('registrationEndAt')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="registrationPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Valor da inscrição (R$)"
                    type="number"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
              <Controller
                name="registrationOpen"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label={field.value ? 'Inscrições abertas' : 'Inscrições fechadas'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Chave PIX" fullWidth {...register('pixKey')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Nome do recebedor" fullWidth {...register('pixReceiverName')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Número WhatsApp" fullWidth placeholder="55 11 91234-5678" {...register('whatsappNumber')} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instruções de pagamento"
                fullWidth
                multiline
                minRows={2}
                {...register('paymentInstructions')}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={() => navigate('/admin/events')} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
