import { useEffect, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { BracketGroup, BracketGroupTree, Event } from '../../types/api';
import { formatDateTime } from '../../utils/format';

type BracketData = BracketGroup[] | BracketGroupTree[];

type TeamSlot = BracketGroup['teams'][number] | null;
type LegacyBracketMatch = {
  id: string;
  home: TeamSlot;
  away: TeamSlot;
  homeSetsWon?: number;
  awaySetsWon?: number;
  status?: string;
  scheduledAt?: string | null;
  court?: string | null;
  winnerTeamId?: number | null;
};
type LegacyBracketRound = { title: string; matches: LegacyBracketMatch[] };

function isTreeBracket(data: BracketData): data is BracketGroupTree[] {
  return data.length === 0 || 'rounds' in data[0];
}

function legacyToTree(groups: BracketGroup[]): BracketGroupTree[] {
  return groups.map((group) => {
    const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
    return {
      groupId: group.groupId,
      groupName: group.groupName,
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Opening round',
          matches: sorted.map((team, index) => ({
            matchId: group.groupId * 1000 + index,
            homeTeamId: team.teamId,
            awayTeamId: null,
            homeTeamName: team.teamName,
            awayTeamName: null,
            homeTeamLogo: team.logo ?? null,
            awayTeamLogo: null,
            homeSetsWon: 0,
            awaySetsWon: 0,
            winnerTeamId: null,
            winnerTeamName: null,
            winnerTeamLogo: null,
            status: 'SCHEDULED',
            scheduledAt: null,
            court: null,
            nextMatchId: null,
            nextSlot: null,
            displayOrder: index,
          })),
        },
      ],
    };
  });
}

function treeToLegacyRounds(group: BracketGroupTree): LegacyBracketRound[] {
  return group.rounds.map((round) => ({
    title: round.roundName,
    matches: round.matches.map((match) => ({
      id: String(match.matchId),
      home:
        match.homeTeamId != null
          ? { teamId: match.homeTeamId, teamName: match.homeTeamName ?? '', logo: match.homeTeamLogo, displayOrder: 0 }
          : null,
      away:
        match.awayTeamId != null
          ? { teamId: match.awayTeamId, teamName: match.awayTeamName ?? '', logo: match.awayTeamLogo, displayOrder: 0 }
          : null,
      homeSetsWon: match.homeSetsWon,
      awaySetsWon: match.awaySetsWon,
      status: match.status,
      scheduledAt: match.scheduledAt,
      court: match.court,
      winnerTeamId: match.winnerTeamId,
    })),
  }));
}

const CARD_H = 90;
const CARD_GAP = 50;
const COL_W = 220;
const COL_GAP = 40;
const ROUND_TITLES = ['Opening round', 'Upper semi-finals', 'Upper final', 'Final'];
const LINE_COLOR = 'rgba(21,101,192,0.28)';

function buildRoundsFromGroup(group: BracketGroup): LegacyBracketRound[] {
  const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length < 2) return [];

  const rounds: LegacyBracketRound[] = [];
  const opening: LegacyBracketMatch[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    opening.push({
      id: `g${group.groupId}-r0-${i}`,
      home: sorted[i] ?? null,
      away: sorted[i + 1] ?? null,
      scheduledAt: null,
      court: null,
    });
  }
  rounds.push({ title: ROUND_TITLES[0], matches: opening });

  let prevCount = opening.length;
  let ri = 1;
  while (prevCount > 1) {
    const nextCount = Math.ceil(prevCount / 2);
    rounds.push({
      title: ROUND_TITLES[ri] ?? `Round ${ri + 1}`,
      matches: Array.from({ length: nextCount }, (_, i) => ({
        id: `g${group.groupId}-r${ri}-${i}`,
        home: null,
        away: null,
      })),
    });
    prevCount = nextCount;
    ri++;
  }
  return rounds;
}

function matchCenterY(roundIndex: number, matchIndex: number): number {
  const factor = 1 << roundIndex;
  const unit = CARD_H + CARD_GAP;
  const top = matchIndex * factor * unit + CARD_H / 2;
  const bottom = ((matchIndex + 1) * factor - 1) * unit + CARD_H / 2;
  return (top + bottom) / 2;
}

function matchTopY(roundIndex: number, matchIndex: number): number {
  return matchCenterY(roundIndex, matchIndex) - CARD_H / 2;
}

function resolveRowBg(isSelected: boolean, isTop: boolean): string {
  if (isSelected) return 'rgba(21,101,192,0.08)';
  if (!isTop) return 'rgba(0,0,0,0.03)';
  return 'transparent';
}

function resolveTeamBorderColor(team: TeamSlot, isFinished: boolean, isWinner: boolean): string {
  if (!team || !isFinished) return '#3a4455';
  return isWinner ? '#4caf50' : '#ef5350';
}

interface MatchRowProps {
  team: TeamSlot;
  groupId: number;
  isTop: boolean;
  isSelected: boolean;
  isFinished: boolean;
  isWinner: boolean;
  onTeamClick: (groupId: number, teamId: number) => void;
  textColor: string;
  mutedColor: string;
  hoverColor: string;
  selectedColor: string;
  setsWon?: number;
}

function MatchRow({
  team,
  groupId,
  isTop,
  isSelected,
  isFinished,
  isWinner,
  onTeamClick,
  textColor,
  mutedColor,
  hoverColor,
  selectedColor,
  setsWon,
}: Readonly<MatchRowProps>) {
  return (
    <Box
      onClick={(event) => {
        event.stopPropagation();
        if (team) onTeamClick(groupId, team.teamId);
      }}
      sx={{
        flex: 1,
        px: 2,
        py: 0.8,
        minHeight: 40,
        maxHeight: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderLeft: `3px solid ${resolveTeamBorderColor(team, isFinished, isWinner)}`,
        bgcolor: isSelected ? selectedColor : resolveRowBg(false, isTop),
        cursor: team ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
        '&:hover': team ? { bgcolor: hoverColor } : undefined,
      }}
    >
      <Avatar src={team?.logo ?? undefined} variant="rounded" sx={{ width: 24, height: 24, flexShrink: 0 }} />
      <Typography noWrap sx={{ flex: 1, color: team ? textColor : mutedColor, fontSize: 13, fontWeight: 700 }}>
        {team?.teamName ?? 'TBD'}
      </Typography>
      <Typography sx={{ color: mutedColor, fontSize: 12, fontWeight: 700, minWidth: 18, textAlign: 'right' }}>
        {setsWon ?? 0}
      </Typography>
    </Box>
  );
}

interface BracketMatchCardProps {
  match: LegacyBracketMatch;
  groupId: number;
  selectedTeamId: number | null;
  onTeamClick: (groupId: number, teamId: number) => void;
  onMatchClick: (match: LegacyBracketMatch, groupId: number) => void;
  surface: string;
  dividerColor: string;
  textColor: string;
  mutedColor: string;
  hoverColor: string;
  selectedRowColor: string;
}

function BracketMatchCard({
  match,
  groupId,
  selectedTeamId,
  onTeamClick,
  onMatchClick,
  surface,
  dividerColor,
  textColor,
  mutedColor,
  hoverColor,
  selectedRowColor,
}: Readonly<BracketMatchCardProps>) {
  return (
    <Box
      onClick={() => onMatchClick(match, groupId)}
      sx={{
        height: 'auto',
        minHeight: CARD_H,
        bgcolor: surface,
        border: `1px solid ${dividerColor}`,
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 20px rgba(21, 101, 192, 0.08)',
          borderColor: alpha('#1565c0', 0.2),
        },
      }}
    >
      <MatchRow
        team={match.home}
        groupId={groupId}
        isTop
        isSelected={match.home?.teamId === selectedTeamId}
        isFinished={match.status === 'FINISHED'}
        isWinner={match.winnerTeamId != null && match.home?.teamId === match.winnerTeamId}
        onTeamClick={onTeamClick}
        textColor={textColor}
        mutedColor={mutedColor}
        hoverColor={hoverColor}
        selectedColor={selectedRowColor}
        setsWon={match.homeSetsWon}
      />
      <Divider flexItem sx={{ borderColor: dividerColor }} />
      <MatchRow
        team={match.away}
        groupId={groupId}
        isTop={false}
        isSelected={match.away?.teamId === selectedTeamId}
        isFinished={match.status === 'FINISHED'}
        isWinner={match.winnerTeamId != null && match.away?.teamId === match.winnerTeamId}
        onTeamClick={onTeamClick}
        textColor={textColor}
        mutedColor={mutedColor}
        hoverColor={alpha('#1565c0', 0.06)}
        selectedColor={selectedRowColor}
        setsWon={match.awaySetsWon}
      />
      {match.status !== 'FINISHED' && (match.court || match.scheduledAt) && (
        <Box sx={{ px: 1.25, py: 0.75, borderTop: `1px solid ${dividerColor}`, bgcolor: alpha('#1565c0', 0.02) }}>
          <Stack  sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {match.court && (
              <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>{match.court}</Typography>
              </Stack>
            )}
            {match.scheduledAt && (
              <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                <Typography variant="caption" sx={{ fontSize: 11, color: mutedColor }}>
                  {formatDateTime(match.scheduledAt)}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

function buildConnectorEl(ri: number, mi: number, round: LegacyBracketRound): JSX.Element | null {
  if (mi % 2 !== 0) return null;
  const colRight = ri * (COL_W + COL_GAP) + COL_W;
  const nextLeft = colRight + COL_GAP;
  const midX = colRight + COL_GAP / 2;
  const topY = matchCenterY(ri, mi);
  const hasPartner = mi + 1 < round.matches.length;
  const bottomY = hasPartner ? matchCenterY(ri, mi + 1) : topY;
  const nextY = matchCenterY(ri + 1, Math.floor(mi / 2));

  return (
    <g key={`c-${ri}-${mi}`}>
      <line x1={colRight} y1={topY} x2={midX} y2={topY} stroke={LINE_COLOR} strokeWidth={1.5} />
      {hasPartner && (
        <>
          <line x1={colRight} y1={bottomY} x2={midX} y2={bottomY} stroke={LINE_COLOR} strokeWidth={1.5} />
          <line x1={midX} y1={topY} x2={midX} y2={bottomY} stroke={LINE_COLOR} strokeWidth={1.5} />
        </>
      )}
      <line x1={midX} y1={nextY} x2={nextLeft} y2={nextY} stroke={LINE_COLOR} strokeWidth={1.5} />
    </g>
  );
}

function ConnectorLines({ rounds }: Readonly<{ rounds: LegacyBracketRound[] }>) {
  if (rounds.length < 2) return null;
  const openingCount = rounds[0].matches.length;
  const totalH = openingCount * (CARD_H + CARD_GAP) - CARD_GAP;
  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP;

  const elements = rounds
    .slice(0, -1)
    .flatMap((round, ri) =>
      round.matches
        .map((_, mi) => buildConnectorEl(ri, mi, round))
        .filter((el): el is JSX.Element => el !== null),
    );

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalW,
        height: totalH,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {elements}
    </svg>
  );
}

interface GroupBracketProps {
  group: BracketGroup | BracketGroupTree;
  selectedTeamId: number | null;
  onTeamClick: (groupId: number, teamId: number) => void;
  onMatchClick: (match: LegacyBracketMatch, groupId: number) => void;
}

function GroupBracket({ group, selectedTeamId, onTeamClick, onMatchClick }: Readonly<GroupBracketProps>) {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const rounds = 'rounds' in group ? treeToLegacyRounds(group) : buildRoundsFromGroup(group);
  const openingCount = rounds[0]?.matches.length ?? 0;
  const totalH = openingCount > 0 ? openingCount * (CARD_H + CARD_GAP) - CARD_GAP : 0;
  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP;
  const surface = theme.palette.background.paper;
  const dividerColor = theme.palette.divider;
  const textColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;
  const hoverColor = alpha(theme.palette.primary.main, 0.06);
  const selectedRowColor = alpha(theme.palette.primary.main, 0.08);

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderColor: dividerColor }}>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        sx={{
          px: 2.5,
          py: 1.5,
          background: 'linear-gradient(135deg, rgba(21,101,192,0.08), rgba(21,101,192,0.02))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: collapsed ? 'none' : `1px solid ${dividerColor}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography sx={{ color: textColor, fontWeight: 800, fontSize: 15 }}>
            {group.groupName}
          </Typography>
        </Stack>
        <IconButton size="small" sx={{ color: mutedColor, p: 0.5 }} disableRipple>
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ bgcolor: theme.palette.background.default, p: 2.5, overflowX: 'auto', minHeight: (totalH * 2), maxHeight:1000 }}>
          {rounds.length === 0 ? (
            <Typography sx={{ color: mutedColor, fontSize: 13 }}>
              Sem equipes cadastradas neste grupo.
            </Typography>
          ) : (
            <>
              <Stack direction="row" sx={{ mb: 1.5 }}>
                {rounds.map((round, ri) => (
                  <Box key={round.title} sx={{ width: COL_W, mr: `${ri < rounds.length - 1 ? COL_GAP : 0}px` }}>
                    <Typography
                      sx={{
                        color: mutedColor,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      {round.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Box sx={{ position: 'relative', height: totalH, width: totalW, minWidth: totalW }}>
                {rounds.flatMap((round, ri) =>
                  round.matches.map((match, mi) => (
                    <Box
                      key={match.id}
                      sx={{
                        position: 'absolute',
                        top: matchTopY(ri, mi),
                        left: ri * (COL_W + COL_GAP),
                        width: COL_W,
                      }}
                    >
                      <BracketMatchCard
                        match={match}
                        groupId={group.groupId}
                        selectedTeamId={selectedTeamId}
                        onTeamClick={onTeamClick}
                        onMatchClick={onMatchClick}
                        surface={surface}
                        dividerColor={dividerColor}
                        textColor={textColor}
                        mutedColor={mutedColor}
                        hoverColor={hoverColor}
                        selectedRowColor={selectedRowColor}
                      />
                    </Box>
                  )),
                )}
                <ConnectorLines rounds={rounds} />
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export function BracketPage() {
  const { slug } = useParams();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [event, setEvent] = useState<Event | null>(null);
  const [bracket, setBracket] = useState<BracketGroupTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<LegacyBracketMatch | null>(null);
  const [selectedMatchGroupName, setSelectedMatchGroupName] = useState<string>('');
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    Promise.all([publicEventService.findBySlug(slug), standingsService.publicBracket(slug)])
      .then(([e, b]) => {
        setEvent(e);
        setBracket(isTreeBracket(b) ? b : legacyToTree(b));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    enqueueSnackbar('Link copiado para a área de transferência.', { variant: 'success' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: event?.name, url: window.location.href });
    } else {
      await handleCopyLink();
    }
  };

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, { backgroundColor: theme.palette.background.default, scale: 2 });
    const link = document.createElement('a');
    link.download = `chave-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, { backgroundColor: theme.palette.background.default, scale: 2 });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`chave-${slug}.pdf`);
  };

  const handleTeamClick = (groupId: number, teamId: number) => {
    setSelectedTeamId((prev) => (prev === teamId ? null : teamId));
  };

  const handleMatchClick = (match: LegacyBracketMatch, groupId: number) => {
    const group = bracket.find((item) => item.groupId === groupId);
    setSelectedMatch(match);
    setSelectedMatchGroupName(group?.groupName ?? 'Grupo');
  };

  if (loading) return <Loading />;
  if (!event) return <EmptyState title="Evento não encontrado" />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={900} color="text.primary">
          Chave — {event.name}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" startIcon={<ShareIcon />} onClick={handleShare}>
            Compartilhar
          </Button>
          <Button size="small" startIcon={<LinkIcon />} onClick={handleCopyLink}>
            Copiar link
          </Button>
          <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>
            Baixar PDF
          </Button>
          <Button size="small" startIcon={<ImageIcon />} onClick={handleDownloadImage}>
            Baixar imagem
          </Button>
        </Stack>
      </Stack>

      {bracket.length === 0 ? (
        <EmptyState
          title="Chave ainda não disponível"
          description="Os grupos serão exibidos assim que forem definidos."
        />
      ) : (
        <Stack ref={captureRef} spacing={1.5} sx={{ p: 0 }}>
          {bracket.map((group) => (
            <GroupBracket
              key={group.groupId}
              group={group}
              selectedTeamId={selectedTeamId}
              onTeamClick={handleTeamClick}
              onMatchClick={handleMatchClick}
            />
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(selectedMatch)} onClose={() => setSelectedMatch(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Detalhes da partida
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {selectedMatchGroupName}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelectedMatch(null)} aria-label="Fechar dialog">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMatch && (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Equipe 1
                </Typography>
                <Typography fontWeight={700}>{selectedMatch.home?.teamName ?? 'TBD'}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Equipe 2
                </Typography>
                <Typography fontWeight={700}>{selectedMatch.away?.teamName ?? 'TBD'}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Placar
                </Typography>
                <Typography fontWeight={700}>
                  {selectedMatch.homeSetsWon ?? 0} × {selectedMatch.awaySetsWon ?? 0}
                </Typography>
              </Box>

              {selectedMatch.court && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Local
                  </Typography>
                  <Typography fontWeight={700}>{selectedMatch.court}</Typography>
                </Box>
              )}

              {selectedMatch.scheduledAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Data/Hora
                  </Typography>
                  <Typography fontWeight={700}>{formatDateTime(selectedMatch.scheduledAt)}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Status
                </Typography>
                <Chip label={selectedMatch.status ?? 'SCHEDULED'} color={selectedMatch.status === 'FINISHED' ? 'success' : 'primary'} size="small" />
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
