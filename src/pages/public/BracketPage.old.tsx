import { useEffect, useRef, useState } from 'react';
import { Avatar, Box, Button, Collapse, Container, IconButton, Stack, Typography } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { publicEventService } from '../../services/eventService';
import { standingsService } from '../../services/standingsService';
import type { BracketGroup, Event } from '../../types/api';

type TeamSlot = BracketGroup['teams'][number] | null;
type BracketMatch = { id: string; home: TeamSlot; away: TeamSlot };
type BracketRound = { title: string; matches: BracketMatch[] };

const CARD_H = 88;
const CARD_GAP = 14;
const COL_W = 210;
const COL_GAP = 36;
const ROUND_TITLES = ['Opening round', 'Upper semi-finals', 'Upper final', 'Final'];
const CONNECTOR_COLOR = 'rgba(90,110,145,0.65)';

function resolveRowBg(isSelected: boolean, isTop: boolean): string {
  if (isSelected) return 'rgba(21,101,192,0.28)';
  if (!isTop) return 'rgba(0,0,0,0.14)';
  return 'transparent';
}

function matchCenterY(roundIndex: number, matchIndex: number): number {
  const factor = 1 << roundIndex;
  const unit = CARD_H + CARD_GAP;
  const topSlotCenter = matchIndex * factor * unit + CARD_H / 2;
  const bottomSlotCenter = ((matchIndex + 1) * factor - 1) * unit + CARD_H / 2;
  return (topSlotCenter + bottomSlotCenter) / 2;
}

function matchTopY(roundIndex: number, matchIndex: number): number {
  return matchCenterY(roundIndex, matchIndex) - CARD_H / 2;
}

function buildRoundsFromGroup(group: BracketGroup): BracketRound[] {
  const sorted = [...group.teams].sort((a, b) => a.displayOrder - b.displayOrder);
  if (sorted.length < 2) return [];
  const rounds: BracketRound[] = [];
  const opening: BracketMatch[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    opening.push({ id: `g${group.groupId}-r0-${i}`, home: sorted[i] ?? null, away: sorted[i + 1] ?? null });
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

function buildConnectorEl(ri: number, mi: number, round: BracketRound): JSX.Element | null {
  if (mi % 2 !== 0) return null;
  const colRight = ri * (COL_W + COL_GAP) + COL_W;
  const nextLeft = colRight + COL_GAP;
  const midX = colRight + COL_GAP / 2;
  const topY = matchCenterY(ri, mi);
  const hasPartner = mi + 1 < round.matches.length;
  const bottomY = hasPartner ? matchCenterY(ri, mi + 1) : topY;
  const nextY = matchCenterY(ri + 1, Math.floor(mi / 2));
  return (
    <g key={`conn-${ri}-${mi}`}>
      <line x1={colRight} y1={topY} x2={midX} y2={topY} stroke={CONNECTOR_COLOR} strokeWidth={1.5} />
      {hasPartner && (
        <>
          <line x1={colRight} y1={bottomY} x2={midX} y2={bottomY} stroke={CONNECTOR_COLOR} strokeWidth={1.5} />
          <line x1={midX} y1={topY} x2={midX} y2={bottomY} stroke={CONNECTOR_COLOR} strokeWidth={1.5} />
        </>
      )}
      <line x1={midX} y1={nextY} x2={nextLeft} y2={nextY} stroke={CONNECTOR_COLOR} strokeWidth={1.5} />
    </g>
  );
}

interface MatchRowProps {
  team: TeamSlot;
  groupId: number;
  isTop: boolean;
  isSelected: boolean;
  onTeamClick: (groupId: number, teamId: number) => void;
}

function resolveTeamBorderColor(team: TeamSlot, isTop: boolean): string {
  if (!team) return '#3a4455';
  return isTop ? '#4caf50' : '#ef5350';
}

function MatchRow({ team, groupId, isTop, isSelected, onTeamClick }: Readonly<MatchRowProps>) {
  const borderColor = resolveTeamBorderColor(team, isTop);
  return (
    <Box
      onClick={() => team && onTeamClick(groupId, team.teamId)}
      sx={{
        flex: 1,
        px: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderLeft: `3px solid ${borderColor}`,
        bgcolor: resolveRowBg(isSelected, isTop),
        cursor: team ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
        '&:hover': team ? { bgcolor: 'rgba(255,255,255,0.07)' } : undefined,
      }}
    >
      <Avatar src={team?.logo ?? undefined} variant="rounded" sx={{ width: 22, height: 22, flexShrink: 0 }} />
      <Typography noWrap sx={{ flex: 1, color: team ? '#dde2ec' : '#4a5568', fontSize: 13, fontWeight: 700 }}>
        {team?.teamName ?? 'TBD'}
      </Typography>
    </Box>
  );
}

interface BracketMatchCardProps {
  match: BracketMatch;
  groupId: number;
  selectedTeamId: number | null;
  onTeamClick: (groupId: number, teamId: number) => void;
}

function BracketMatchCard({ match, groupId, selectedTeamId, onTeamClick }: Readonly<BracketMatchCardProps>) {
  return (
    <Box sx={{ height: CARD_H, bgcolor: '#22293a', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <MatchRow team={match.home} groupId={groupId} isTop isSelected={match.home?.teamId === selectedTeamId} onTeamClick={onTeamClick} />
      <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.07)' }} />
      <MatchRow team={match.away} groupId={groupId} isTop={false} isSelected={match.away?.teamId === selectedTeamId} onTeamClick={onTeamClick} />
    </Box>
  );
}

function ConnectorLines({ rounds }: Readonly<{ rounds: BracketRound[] }>) {
  if (rounds.length < 2) return null;
  const openingCount = rounds[0].matches.length;
  const totalH = openingCount * (CARD_H + CARD_GAP) - CARD_GAP;
  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP;
  const elements = rounds
    .slice(0, -1)
    .flatMap((round, ri) =>
      round.matches.map((_, mi) => buildConnectorEl(ri, mi, round)).filter((el): el is JSX.Element => el !== null),
    );
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: totalW, height: totalH, pointerEvents: 'none', overflow: 'visible' }}>
      {elements}
    </svg>
  );
}

interface GroupBracketProps {
  group: BracketGroup;
  selectedTeamId: number | null;
  onTeamClick: (groupId: number, teamId: number) => void;
}

function GroupBracket({ group, selectedTeamId, onTeamClick }: Readonly<GroupBracketProps>) {
  const [collapsed, setCollapsed] = useState(false);
  const rounds = buildRoundsFromGroup(group);
  const openingCount = rounds[0]?.matches.length ?? 0;
  const totalH = openingCount > 0 ? openingCount * (CARD_H + CARD_GAP) - CARD_GAP : 0;
  const totalW = rounds.length * COL_W + (rounds.length - 1) * COL_GAP;
  return (
    <Box sx={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        sx={{
          px: 2.5, py: 1.5, bgcolor: '#1a2030', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography sx={{ color: '#e0e6f0', fontWeight: 800, fontSize: 15 }}>{group.groupName}</Typography>
        <IconButton size="small" sx={{ color: '#6a7f99', p: 0.5 }} disableRipple>
          {collapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={!collapsed}>
        <Box sx={{ bgcolor: '#141922', p: 2.5, overflowX: 'auto' }}>
          {rounds.length === 0 ? (
            <Typography sx={{ color: '#6a7f99', fontSize: 13 }}>Sem equipes cadastradas neste grupo.</Typography>
          ) : (
            <>
              <Stack direction="row" sx={{ mb: 1.5 }}>
                {rounds.map((round, ri) => (
                  <Box key={round.title} sx={{ width: COL_W, mr: `${ri < rounds.length - 1 ? COL_GAP : 0}px` }}>
                    <Typography sx={{ color: '#6a7f99', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
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
                      sx={{ position: 'absolute', top: matchTopY(ri, mi), left: ri * (COL_W + COL_GAP), width: COL_W }}
                    >
                      <BracketMatchCard match={match} groupId={group.groupId} selectedTeamId={selectedTeamId} onTeamClick={onTeamClick} />
                    </Box>
                  )),
                )}
                <ConnectorLines rounds={rounds} />
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export function BracketPage() {
  const { slug } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [event, setEvent] = useState<Event | null>(null);
  const [bracket, setBracket] = useState<BracketGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    Promise.all([publicEventService.findBySlug(slug), standingsService.publicBracket(slug)])
      .then(([e, b]) => {
        setEvent(e);
        setBracket(b);
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
    const canvas = await html2canvas(captureRef.current, { backgroundColor: '#141922', scale: 2 });
    const link = document.createElement('a');
    link.download = `chave-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, { backgroundColor: '#141922', scale: 2 });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`chave-${slug}.pdf`);
  };

  const handleTeamClick = (groupId: number, teamId: number) => {
    setSelectedTeamId((prev) => (prev === teamId ? null : teamId));
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
        <Typography variant="h5" fontWeight={900}>
          Chave — {event.name}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" startIcon={<ShareIcon />} onClick={handleShare}>Compartilhar</Button>
          <Button size="small" startIcon={<LinkIcon />} onClick={handleCopyLink}>Copiar link</Button>
          <Button size="small" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPdf}>Baixar PDF</Button>
          <Button size="small" startIcon={<ImageIcon />} onClick={handleDownloadImage}>Baixar imagem</Button>
        </Stack>
      </Stack>

      {bracket.length === 0 ? (
        <EmptyState title="Chave ainda não disponível" description="Os grupos serão exibidos assim que forem definidos." />
      ) : (
        <Stack ref={captureRef} spacing={1.5}>
          {bracket.map((group) => (
            <GroupBracket key={group.groupId} group={group} selectedTeamId={selectedTeamId} onTeamClick={handleTeamClick} />
          ))}
        </Stack>
      )}
    </Container>
  );
}


