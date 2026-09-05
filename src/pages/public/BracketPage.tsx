import { useEffect, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { BracketGroup, BracketGroupTree, Event } from '../../types/api';
import { formatDateTime, matchStatusLabels } from '../../utils/format';

type BracketData = BracketGroup[] | BracketGroupTree[];

type TeamSlot = BracketGroup['teams'][number] | null;
type LegacyBracketMatch = {
  id: string;
  sourceMatchId?: number | null;
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
      sourceMatchId: match.sourceMatchId,
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
const LINE_COLOR = 'rgba(230,57,70,0.62)';

const STAGE_LABELS: Record<string, string> = {
  'Opening round': 'Fase de Grupos',
  'Group Stage': 'Fase de Grupos',
  Quarterfinals: 'Quartas de Finais',
  Quarterfinal: 'Quartas de Finais',
  'Upper semi-finals': 'Semi-Finais',
  Semifinals: 'Semi-Finais',
  Semifinal: 'Semi-Finais',
  'Upper final': 'Finais',
  Final: 'Finais',
};

function formatStageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

function buildRoundsFromGroup(group: BracketGroup): LegacyBracketRound[] {
  const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length < 2) return [];

  const rounds: LegacyBracketRound[] = [];
  const opening: LegacyBracketMatch[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    opening.push({
      id: `g${group.groupId}-r0-${i}`,
      sourceMatchId: i,
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

function resolveRowBg(isWinner: boolean, isTop: boolean): string {
  if (isWinner) return 'rgba(76, 175, 80, 0.18)';
  if (!isTop) return 'rgba(0,0,0,0.12)';
  return 'transparent';
}

function resolveTeamBorderColor(team: TeamSlot, isFinished: boolean, isWinner: boolean): string {
  if (!team || !isFinished) return '#69717d';
  return isWinner ? '#4caf50' : '#ef5350';
}

interface MatchRowProps {
  team: TeamSlot;
  isTop: boolean;
  isFinished: boolean;
  isWinner: boolean;
  textColor: string;
  mutedColor: string;
  hoverColor: string;
  setsWon?: number;
}

function MatchRow({
  team,
  isTop,
  isFinished,
  isWinner,
  textColor,
  mutedColor,
  hoverColor,
  setsWon,
}: Readonly<MatchRowProps>) {
  let nameColor = team ? textColor : mutedColor;
    if (isWinner) nameColor = '#a7e3ad';
  return (
    <Box
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
        bgcolor: resolveRowBg(isWinner, isTop),
        cursor: 'default',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: hoverColor },
      }}
    >
      <Avatar
        src={team?.logo ?? undefined}
        variant="rounded"
        sx={{ width: 24, height: 24, flexShrink: 0 }}
      />
      <Typography noWrap sx={{ flex: 1, color: nameColor, fontSize: 13, fontWeight: isWinner ? 800 : 700 }}>
        {team?.teamName ?? 'TBD'}
      </Typography>
      <Typography sx={{ color: isWinner ? '#2e7d32' : mutedColor, fontSize: 12, fontWeight: isWinner ? 800 : 700, minWidth: 18, textAlign: 'right' }}>
        {setsWon ?? 0}
      </Typography>
    </Box>
  );
}

interface BracketMatchCardProps {
  match: LegacyBracketMatch;
  onMatchClick: (sourceMatchId: number) => void;
  surface: string;
  dividerColor: string;
  textColor: string;
  mutedColor: string;
  hoverColor: string;
}

function BracketMatchCard({
  match,
  onMatchClick,
  surface,
  dividerColor,
  textColor,
  mutedColor,
  hoverColor,
}: Readonly<BracketMatchCardProps>) {
  const tooltipContent = (
    <Box
      sx={{
        minWidth: 230,
        p: 1.25,
        borderRadius: 2,
        bgcolor: '#464950',
        color: '#f2f3f5',
        border: '1px solid #69717d',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#ff5964',
          display: 'block',
          mb: 1,
          fontWeight: 800,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Detalhes da partida
      </Typography>

      <Stack spacing={0.8}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Equipe 1</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>{match.home?.teamName ?? 'TBD'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Equipe 2</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>{match.away?.teamName ?? 'TBD'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Placar</Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#ff5964', fontSize: '0.8125rem' }}>
            {match.homeSetsWon ?? 0} × {match.awaySetsWon ?? 0}
          </Typography>
        </Box>

        {match.court && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Local</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>{match.court}</Typography>
          </Box>
        )}

        {match.scheduledAt && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Data/Hora</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>{formatDateTime(match.scheduledAt)}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: match.status === 'FINISHED' ? '#a7e3ad' : '#ff5964',
              fontSize: '0.8125rem',
            }}
          >
            {matchStatusLabels[match.status ?? 'SCHEDULED'] ?? match.status ?? 'Agendado'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      disableInteractive
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            p: 0,
            maxWidth: 'none',
          },
        },
      }}
    >
      <Box
        onClick={() => {
          if (match.sourceMatchId) {
            onMatchClick(match.sourceMatchId);
          }
        }}
        sx={{
          height: 'auto',
          minHeight: CARD_H,
          bgcolor: surface,
          border: `1px solid ${dividerColor}`,
          borderRadius: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
          cursor: 'pointer',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)',
            borderColor: '#e63946',
          },
        }}
      >
        <MatchRow
          team={match.home}
          isTop
          isFinished={match.status === 'FINISHED'}
          isWinner={match.winnerTeamId != null && match.home?.teamId === match.winnerTeamId}
          textColor={textColor}
          mutedColor={mutedColor}
          hoverColor={hoverColor}
          setsWon={match.homeSetsWon}
        />
        <Divider flexItem sx={{ borderColor: dividerColor }} />
        <MatchRow
          team={match.away}
          isTop={false}
          isFinished={match.status === 'FINISHED'}
          isWinner={match.winnerTeamId != null && match.away?.teamId === match.winnerTeamId}
          textColor={textColor}
          mutedColor={mutedColor}
          hoverColor="rgba(230,57,70,0.12)"
          setsWon={match.awaySetsWon}
        />
        {match.status !== 'FINISHED' && (match.court || match.scheduledAt) && (
          <Box sx={{ px: 1.25, py: 0.75, borderTop: `1px solid ${dividerColor}`, bgcolor: 'rgba(0,0,0,0.12)' }}>
            <Stack sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
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
    </Tooltip>
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
  onMatchClick: (matchId: number) => void;
}

function GroupBracket({ group, onMatchClick }: Readonly<GroupBracketProps>) {
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
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderColor: dividerColor }}>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 15 }}>
          {group.groupName}
        </Typography>
        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }} disableRipple>
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        <Box
          sx={{
            bgcolor: theme.palette.background.default,
            p: { xs: 1.5, sm: 2.5 },
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            minHeight: totalH * 2,
            maxHeight: 1000,
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.main', borderRadius: 1 },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.18)' },
          }}
        >
          {rounds.length === 0 ? (
            <Typography sx={{ color: mutedColor, fontSize: 13 }}>
              Sem equipes cadastradas neste grupo.
            </Typography>
          ) : (
            <>
              <Typography
                variant="caption"
                sx={{ display: { xs: 'block', sm: 'none' }, mb: 1, color: mutedColor, fontWeight: 700 }}
              >
                Deslize horizontalmente para ver todas as fases
              </Typography>
              <Stack direction="row" sx={{ mb: 2, minWidth: totalW }}>
                {rounds.map((round, ri) => (
                  <Box key={round.title} sx={{ width: COL_W, mr: `${ri < rounds.length - 1 ? COL_GAP : 0}px` }}>
                    <Box
                      sx={{
                        minHeight: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(230,57,70,0.14)',
                        border: '1px solid rgba(230,57,70,0.4)',
                        borderRadius: 1,
                        px: 1.5,
                        py: 0.6,
                        textAlign: 'center',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#ffecef',
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: 1.2,
                          lineHeight: 1.1,
                        }}
                      >
                        {formatStageLabel(round.title)}
                      </Typography>
                    </Box>
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
                        onMatchClick={onMatchClick}
                        surface={surface}
                        dividerColor={dividerColor}
                        textColor={textColor}
                        mutedColor={mutedColor}
                        hoverColor={hoverColor}
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
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [event, setEvent] = useState<Event | null>(null);
  const [bracket, setBracket] = useState<BracketGroupTree[]>([]);
  const [loading, setLoading] = useState(true);
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

  const captureBracket = async () => {
    if (!captureRef.current) return null;
    const images = Array.from(captureRef.current.querySelectorAll('img'));
    const originalSources = images.map((image) => image.src);
    images.forEach((image) => {
      try {
        const source = new URL(image.src);
        if (source.origin !== window.location.origin) {
          image.src = `/media${source.pathname}${source.search}`;
        }
      } catch {
        // Keep relative or data URLs unchanged.
      }
    });

    try {
      await Promise.all(images.map((image) => image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          })));
      return await html2canvas(captureRef.current, {
        backgroundColor: theme.palette.background.default,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
    } finally {
      images.forEach((image, index) => { image.src = originalSources[index]; });
    }
  };

  const handleDownloadImage = async () => {
    const canvas = await captureBracket();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `chave-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPdf = async () => {
    const canvas = await captureBracket();
    if (!canvas) return;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`chave-${slug}.pdf`);
  };

  const handleMatchClick = (sourceMatchId: number) => {
    if (!slug) return;
    navigate(`/event/${slug}/partida/${sourceMatchId}`);
  };

  if (loading) return <Loading />;
  if (!event) return <EmptyState title="Evento não encontrado" />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, md: 2.5 }, mb: 3, bgcolor: 'rgba(21,101,192,0.04)', borderColor: 'rgba(21,101,192,0.12)' }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}>
              {event.name}
            </Typography>
            <Typography variant="h5" fontWeight={900} color="text.primary">
              Chave do campeonato
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" startIcon={<ShareIcon />} onClick={handleShare}>
              Compartilhar
            </Button>
            <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={handleCopyLink}>
              Copiar link
            </Button>
            <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>
              Baixar PDF
            </Button>
            <Button size="small" variant="outlined" startIcon={<ImageIcon />} onClick={handleDownloadImage}>
              Baixar imagem
            </Button>
          </Stack>
        </Stack>
      </Paper>

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
              onMatchClick={handleMatchClick}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}
