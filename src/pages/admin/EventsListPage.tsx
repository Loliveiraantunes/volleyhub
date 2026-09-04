import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Stack } from '@mui/material';
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

  let eventContent: ReactNode;
  if (loading) {
    eventContent = <Loading />;
  } else if (events.length === 0) {
    eventContent = (
      <EmptyState
        title="Nenhum evento cadastrado"
        description="Crie o primeiro evento para começar a gerenciar o campeonato."
        action={
          <Button variant="contained" onClick={() => navigate('/admin/events/new')}>
            Criar evento
          </Button>
        }
      />
    );
  } else {
    eventContent = (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 1.5, sm: 2 }, width: '100%' }}>
        {events.map((event) => {
          const currentCategory = category(event.categoryId);
          return (
            <Box key={event.id} sx={{ minWidth: 0 }}>
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
            </Box>
          );
        })}
      </Box>
    );
  }

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

      {eventContent}

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
