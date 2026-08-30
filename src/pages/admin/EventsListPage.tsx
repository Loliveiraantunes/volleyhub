import { useEffect, useState } from 'react';
import { Grid, IconButton, Menu, MenuItem, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EventCard } from '../../components/EventCard';
import { Button } from '@mui/material';
import { eventService } from '../../services/eventService';
import { eventCategoryService } from '../../services/eventCategoryService';
import type { Event, EventCategory } from '../../types/api';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';

export function EventsListPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setSelectedEvent } = useSelectedEvent();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuState, setMenuState] = useState<{ anchor: HTMLElement; event: Event } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([eventService.findAll(), eventCategoryService.findAll()])
      .then(([e, c]) => {
        setEvents(e);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleManage = (event: Event) => {
    setSelectedEvent(event);
    navigate('/admin');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eventService.remove(deleteTarget.id);
      enqueueSnackbar('Evento excluído com sucesso.', { variant: 'success' });
      setDeleteTarget(null);
      load();
    } catch (err) {
      enqueueSnackbar((err as { message?: string }).message ?? 'Não foi possível excluir o evento.', {
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const category = (id: number) => categories.find((c) => c.id === id);

  return (
    <>
      <PageHeader
        title="Eventos"
        subtitle="Gerencie os campeonatos cadastrados"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/events/new')}>
            Novo evento
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Crie o primeiro evento para começar a gerenciar o campeonato."
          action={
            <Button variant="contained" onClick={() => navigate('/admin/events/new')}>
              Criar evento
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {events.map((event) => {
            const currentCategory = category(event.categoryId);
            return (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Stack sx={{ position: 'relative' }}>
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, bgcolor: 'background.paper' }}
                    onClick={(e) => setMenuState({ anchor: e.currentTarget, event })}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <EventCard
                    event={event}
                    categoryName={currentCategory?.name}
                    categoryMinimumAgeEnabled={currentCategory?.minimumAgeEnabled}
                    categoryMinimumAge={currentCategory?.minimumAge}
                    onClick={() => handleManage(event)}
                  />
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Menu anchorEl={menuState?.anchor} open={!!menuState} onClose={() => setMenuState(null)}>
        <MenuItem
          onClick={() => {
            if (menuState) handleManage(menuState.event);
            setMenuState(null);
          }}
        >
          Gerenciar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuState) navigate(`/admin/events/${menuState.event.id}/edit`);
            setMenuState(null);
          }}
        >
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuState) window.open(`/event/${menuState.event.slug}`, '_blank', 'noopener,noreferrer');
            setMenuState(null);
          }}
        >
          <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} />
          Ver página pública
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            if (menuState) setDeleteTarget(menuState.event);
            setMenuState(null);
          }}
        >
          Excluir
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir evento"
        description={`Tem certeza que deseja excluir o evento "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
