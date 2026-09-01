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
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';

const DRAWER_WIDTH = 260;

export function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const { adminEmail, logout } = useAuth();
  const { selectedEvent } = useSelectedEvent();
  const navigate = useNavigate();
  const location = useLocation();

  const eventId = selectedEvent?.id;

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, to: '/admin' },
    { label: 'Eventos', icon: <EventIcon />, to: '/admin/events' },
    { label: 'Equipes', icon: <GroupsIcon />, to: eventId ? `/admin/events/${eventId}/teams` : '/admin/events', disabled: !eventId },
    { label: 'Grupos', icon: <ViewModuleIcon />, to: eventId ? `/admin/events/${eventId}/groups` : '/admin/events', disabled: !eventId },
    { label: 'Classificação', icon: <LeaderboardIcon />, to: eventId ? `/admin/events/${eventId}/standings` : '/admin/events', disabled: !eventId },
    { label: 'Configurações', icon: <SettingsIcon />, to: '/admin/settings/categories' },
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={800} color="primary">
          Volleyhub
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
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
                selected={location.pathname.startsWith(item.to.split('/').slice(0, 3).join('/')) && item.to !== '/admin/events'}
                disabled={item.disabled}
                onClick={() => setMobileOpen(false)}
                sx={{ mx: 1, borderRadius: 2 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
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
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Evento selecionado
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {selectedEvent?.name ?? 'Nenhum evento selecionado'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {adminEmail}
            </Typography>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32 }}>{adminEmail?.[0]?.toUpperCase() ?? 'A'}</Avatar>
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
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
