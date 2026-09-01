export type EventGender = 'FEMALE' | 'MALE' | 'MIXED';

export type RegistrationStatus =
  | 'PENDING'
  | 'PAYMENT_SENT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export type StaffRole = 'COACH' | 'ASSISTANT';

export interface EventCategory {
  id: number;
  name: string;
  active: boolean;
  minimumAgeEnabled: boolean;
  minimumAge?: number | null;
}

export type EventCategoryRequest = Omit<EventCategory, 'id'>;

export interface Event {
  id: number;
  name: string;
  slug: string;
  coverImage?: string | null;
  gender: EventGender;
  categoryId: number;
  description?: string | null;
  regulation?: string | null;
  registrationGuide?: string | null;
  registrationStartAt?: string | null;
  registrationEndAt?: string | null;
  registrationOpen: boolean;
  pixKey?: string | null;
  pixReceiverName?: string | null;
  registrationPrice?: number | null;
  paymentInstructions?: string | null;
  whatsappNumber?: string | null;
}

export type EventRequest = Omit<Event, 'id' | 'slug'>;

export interface Team {
  id: number;
  eventId: number;
  name: string;
  logo?: string | null;
  registrationStatus: RegistrationStatus;
}

export type TeamRequest = Omit<Team, 'id' | 'eventId'>;

export interface Player {
  id: number;
  teamId: number;
  fullName: string;
  cpf?: string | null;
  birthDate?: string | null;
}

export type PlayerRequest = Omit<Player, 'id' | 'teamId'>;

export interface TechnicalStaff {
  id: number;
  teamId: number;
  fullName: string;
  role: StaffRole;
}

export type TechnicalStaffRequest = Omit<TechnicalStaff, 'id' | 'teamId'>;

export interface GroupStageTeam {
  groupId: number;
  teamId: number;
  displayOrder: number;
}

export interface GroupStage {
  id: number;
  eventId: number;
  name: string;
  displayOrder: number;
  teams: GroupStageTeam[];
}

export interface GroupStageRequest {
  name: string;
  displayOrder: number;
}

export interface MatchSet {
  id: number;
  matchId: number;
  setNumber: number;
  homePoints: number;
  awayPoints: number;
}

export interface MatchSetRequest {
  setNumber: number;
  homePoints: number;
  awayPoints: number;
}

export interface MatchSetDetailResponse {
  setNumber: number;
  homePoints: number;
  awayPoints: number;
}

export interface PlayerDetailResponse {
  id: number;
  fullName: string;
  cpf?: string | null;
  birthDate?: string | null;
}

export interface TechnicalStaffDetailResponse {
  id: number;
  fullName: string;
  role: string;
}

export interface TeamDetailResponse {
  teamId: number;
  teamName: string;
  teamLogo?: string | null;
  players: PlayerDetailResponse[];
  technicalStaff: TechnicalStaffDetailResponse[];
}

export interface MatchDetailResponse {
  matchId: number;
  status: MatchStatus;
  scheduledAt?: string | null;
  court?: string | null;
  homeSetsWon: number;
  awaySetsWon: number;
  homeTeam: TeamDetailResponse;
  awayTeam: TeamDetailResponse;
  sets: MatchSetDetailResponse[];
  winnerTeamId?: number | null;
}

export interface Match {
  id: number;
  eventId: number;
  groupId?: number | null;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt?: string | null;
  court?: string | null;
  status: MatchStatus;
  homeSetsWon: number;
  awaySetsWon: number;
  winnerTeamId?: number | null;
  sets: MatchSet[];
}

export interface MatchRequest {
  groupId?: number | null;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt?: string | null;
  court?: string | null;
  status: MatchStatus;
  sets: MatchSetRequest[];
}

export interface StandingsEntry {
  position: number;
  teamId: number;
  teamName: string;
  logo?: string | null;
  points: number;
}

export interface GroupStandings {
  groupId: number;
  groupName: string;
  entries: StandingsEntry[];
}

export interface BracketTeam {
  teamId: number;
  teamName: string;
  logo?: string | null;
  displayOrder: number;
}

export interface BracketGroup {
  groupId: number;
  groupName: string;
  teams: BracketTeam[];
}

export type BracketSlot = 'HOME' | 'AWAY' | null;

export interface BracketMatch {
  matchId: number;
  sourceMatchId: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeSetsWon: number;
  awaySetsWon: number;
  winnerTeamId: number | null;
  winnerTeamName: string | null;
  winnerTeamLogo?: string | null;
  status: MatchStatus;
  scheduledAt?: string | null;
  court?: string | null;
  nextMatchId: number | null;
  nextSlot: BracketSlot;
  displayOrder: number;
}

export interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
}

export interface BracketGroupTree {
  groupId: number;
  groupName: string;
  rounds: BracketRound[];
}

export interface RegistrationPlayerRequest {
  fullName: string;
  cpf?: string | null;
  birthDate?: string | null;
}

export interface RegistrationTechnicalStaffRequest {
  fullName: string;
  role: StaffRole;
}

export interface PublicRegistrationRequest {
  teamName: string;
  logo?: string | null;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  responsiblePhone?: string | null;
  players: RegistrationPlayerRequest[];
  technicalStaff: RegistrationTechnicalStaffRequest[];
}

export interface Registration {
  id: number;
  eventId: number;
  teamId?: number | null;
  status: string;
  pixKey?: string | null;
  pixReceiverName?: string | null;
  registrationPrice?: number | null;
  paymentInstructions?: string | null;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  type: string;
  expiresIn: number;
}
