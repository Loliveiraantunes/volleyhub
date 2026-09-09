import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';

const DRAWER_WIDTH = 190;

export function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const { adminEmail, adminName, logout } = useAuth();
  const { selectedEvent } = useSelectedEvent();
  const navigate = useNavigate();
  const location = useLocation();

  const eventId = selectedEvent?.id;

  const isNavItemSelected = (to: string) => {
    if (to === '/admin') return location.pathname === '/admin';
    if (to === '/admin/events') {
      return location.pathname === to || location.pathname === '/admin/events/new' || /^\/admin\/events\/[^/]+\/edit$/.test(location.pathname);
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, to: '/admin' },
    { label: 'Eventos', icon: <EventIcon />, to: '/admin/events' },
    { label: 'Equipes', icon: <GroupsIcon />, to: eventId ? `/admin/events/${eventId}/teams` : '/admin/events', disabled: !eventId },
    { label: 'Grupos', icon: <ViewModuleIcon />, to: eventId ? `/admin/events/${eventId}/groups` : '/admin/events', disabled: !eventId },
    { label: 'Classificação', icon: <LeaderboardIcon />, to: eventId ? `/admin/events/${eventId}/standings` : '/admin/events', disabled: !eventId },
    { label: 'Categorias', icon: <CategoryIcon />, to: '/admin/settings/categories' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ minHeight: 62, px: 1.5, background: 'linear-gradient(135deg, #1a1d22 0%, #17181c 100%)', color: 'white', borderBottom: '2px solid #ff002e', boxShadow: '0 4px 12px rgba(255, 0, 46, 0.15)' }}>
        <Typography variant="subtitle1" fontWeight={900} sx={{ letterSpacing: 0.9 }}>
          VOLLEY<span style={{ color: '#ff3349' }}>HUB</span>
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 0, 46, 0.2)' }} />
      <List sx={{ flex: 1, py: 1, px: 0.5 }}>
        {navItems.map((item) => (
          <Tooltip
            key={item.label}
            title={item.disabled ? 'Selecione um evento primeiro' : ''}
            placement="right"
          >
            <span>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={isNavItemSelected(item.to)}
                disabled={item.disabled}
                onClick={() => setMobileOpen(false)}
                sx={{
                  mx: 0.75,
                  borderRadius: 1.5,
                  color: 'grey.300',
                  transition: 'all 0.3s ease',
                  '& .MuiListItemIcon-root': { color: 'grey.400', transition: 'color 0.3s ease' },
                  '& .MuiListItemIcon-root svg': { fontSize: 20 },
                  '&:hover': {
                    bgcolor: 'rgba(255,0,46,0.15)',
                    color: '#ff3349',
                    transform: 'translateX(4px)',
                    '& .MuiListItemIcon-root': { color: '#ff3349' },
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(255, 0, 46, 0.9) 0%, rgba(204, 0, 30, 0.8) 100%)',
                    color: 'white',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(255, 0, 46, 0.3)',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff3349 0%, #ff002e 100%)',
                      transform: 'translateX(4px)',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={{ '& .MuiListItemText-primary': { fontSize: 13, fontWeight: 700 } }} />
              </ListItemButton>
            </span>
          </Tooltip>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{ bgcolor: '#202126', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', zIndex: theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              Evento selecionado
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {selectedEvent?.name ?? 'Nenhum evento selecionado'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={700}>
                {adminName ?? adminEmail}
              </Typography>
              {adminName && (
                <Typography variant="caption" color="text.secondary">
                  {adminEmail}
                </Typography>
              )}
            </Box>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{(adminName ?? adminEmail)?.[0]?.toUpperCase() ?? 'A'}</Avatar>
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={!!userMenuAnchor} onClose={() => setUserMenuAnchor(null)}>
              <MenuItem
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Sair
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #1a1d22 0%, #202126 50%, #1a1d22 100%)',
              borderRight: '2px solid rgba(255, 0, 46, 0.2)',
              boxShadow: '4px 0 16px rgba(255, 0, 46, 0.1)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, bgcolor: 'background.default', minHeight: '100vh', overflowX: 'hidden' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
