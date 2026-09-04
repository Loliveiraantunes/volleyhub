import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { eventCategoryService } from '../../services/eventCategoryService';
import type { EventCategory } from '../../types/api';
export function EventCategoriesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EventCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [minimumAgeEnabled, setMinimumAgeEnabled] = useState(false);
  const [minimumAge, setMinimumAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventCategory | null>(null);

  const load = () => {
    setLoading(true);
    eventCategoryService.findAll().then(setCategories).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setActive(true);
    setMinimumAgeEnabled(false);
    setMinimumAge('');
    setDialogOpen(true);
  };

  const openEdit = (category: EventCategory) => {
    setEditing(category);
    setName(category.name);
    setActive(category.active);
    setMinimumAgeEnabled(category.minimumAgeEnabled);
    setMinimumAge(category.minimumAge != null ? String(category.minimumAge) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name,
        active,
        minimumAgeEnabled,
        minimumAge: minimumAgeEnabled && minimumAge ? Number(minimumAge) : null,
      };
      if (editing) {
        await eventCategoryService.update(editing.id, data);
        enqueueSnackbar('Categoria atualizada.', { variant: 'success' });
      } else {
        await eventCategoryService.create(data);
        enqueueSnackbar('Categoria criada.', { variant: 'success' });
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível salvar os dados.', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eventCategoryService.remove(deleteTarget.id);
      enqueueSnackbar('Categoria excluída.', { variant: 'success' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível excluir a categoria.', {
        variant: 'error',
      });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Categorias"
        subtitle="Organize as categorias disponíveis para os eventos"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nova categoria
          </Button>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Card variant="outlined" sx={{ borderTop: '3px solid', borderTopColor: 'primary.main' }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CategoryIcon color="primary" />
              <Box>
                <Typography variant="h5" fontWeight={800}>{categories.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total de categorias</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderTop: '3px solid', borderTopColor: 'success.main' }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CheckCircleIcon color="success" />
              <Box>
                <Typography variant="h5" fontWeight={800}>{categories.filter((category) => category.active).length}</Typography>
                <Typography variant="body2" color="text.secondary">Categorias ativas</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ borderTop: '3px solid', borderTopColor: 'warning.main' }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FilterAltIcon color="warning" />
              <Box>
                <Typography variant="h5" fontWeight={800}>{categories.filter((category) => category.minimumAgeEnabled).length}</Typography>
                <Typography variant="body2" color="text.secondary">Com restrição de idade</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <DataTable
        loading={loading}
        rows={categories}
        rowKey={(c) => c.id}
        emptyTitle="Nenhuma categoria cadastrada"
        columns={[
          { key: 'name', header: 'Nome', render: (c) => c.name },
          { key: 'active', header: 'Ativa', render: (c) => (c.active ? 'Sim' : 'Não') },
          {
            key: 'minimumAge',
            header: 'Restrição de idade',
            render: (c) => (c.minimumAgeEnabled ? `A partir de ${c.minimumAge ?? '-'} anos` : 'Sem restrição'),
          },
          {
            key: 'actions',
            header: 'Ações',
            align: 'right',
            render: (c) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <IconButton size="small" onClick={() => openEdit(c)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ),
          },
        ]}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth />
            <FormControlLabel
              control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
              label="Categoria ativa"
            />
            <FormControlLabel
              control={
                <Switch checked={minimumAgeEnabled} onChange={(e) => setMinimumAgeEnabled(e.target.checked)} />
              }
              label="Restringir por idade"
            />
            {minimumAgeEnabled && (
              <TextField
                label="Idade mínima"
                type="number"
                value={minimumAge}
                onChange={(e) => setMinimumAge(e.target.value)}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
