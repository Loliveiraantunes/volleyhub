import { Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { EventsListPage } from '../pages/admin/EventsListPage';
import { EventFormPage } from '../pages/admin/EventFormPage';
import { EventCategoriesPage } from '../pages/admin/EventCategoriesPage';
import { TeamsListPage } from '../pages/admin/TeamsListPage';
import { TeamDetailPage } from '../pages/admin/TeamDetailPage';
import { GroupsPage } from '../pages/admin/GroupsPage';
import { MatchFormPage } from '../pages/admin/MatchFormPage';
import { MatchSummaryPage } from '../pages/admin/MatchSummaryPage';
import { AdminStandingsPage } from '../pages/admin/AdminStandingsPage';
import { EventPage } from '../pages/public/EventPage';
import { RegistrationPage } from '../pages/public/RegistrationPage';
import { TeamPage } from '../pages/public/TeamPage';
import { BracketPage } from '../pages/public/BracketPage';
import { MatchPage } from '../pages/public/MatchPage';
import { PublicStandingsPage } from '../pages/public/PublicStandingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:slug" element={<EventPage />} />
        <Route path="/event/:slug/inscricao" element={<RegistrationPage />} />
        <Route path="/event/:slug/equipe/:teamId" element={<TeamPage />} />
        <Route path="/event/:slug/chave" element={<BracketPage />} />
        <Route path="/event/:slug/partida/:matchId" element={<MatchPage />} />
        <Route path="/event/:slug/classificacao" element={<PublicStandingsPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsListPage />} />
        <Route path="events/new" element={<EventFormPage />} />
        <Route path="events/:id/edit" element={<EventFormPage />} />
        <Route path="events/:eventId/teams" element={<TeamsListPage />} />
        <Route path="events/:eventId/groups" element={<GroupsPage />} />
        <Route path="events/:eventId/matches/new" element={<MatchFormPage />} />
        <Route path="events/:eventId/standings" element={<AdminStandingsPage />} />
        <Route path="teams/:id" element={<TeamDetailPage />} />
        <Route path="matches/:id" element={<MatchSummaryPage />} />
        <Route path="settings/categories" element={<EventCategoriesPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
