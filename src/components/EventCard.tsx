import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Link, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Event } from '../types/api';
import { formatDate, genderLabels } from '../utils/format';

interface EventCardProps {
  event: Event;
  categoryName?: string;
  categoryMinimumAgeEnabled?: boolean;
  categoryMinimumAge?: number | null;
  onClick?: () => void;
}

export function EventCard({ event, categoryName, categoryMinimumAgeEnabled, categoryMinimumAge, onClick }: Readonly<EventCardProps>) {
  const content = (
    <>
      <CardMedia
        component="div"
        sx={{
          height: { xs: 128, sm: 160 },
          backgroundColor: '#3f4248',
          backgroundImage: event.coverImage ? `url(${event.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <CardContent
        sx={{
          p: { xs: 1.75, sm: 2.25 },
          '&:last-child': { pb: { xs: 1.75, sm: 2.25 } },
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
          {event.name}
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1, mb: 1.25 }} flexWrap="wrap">
          <Chip label={genderLabels[event.gender] ?? event.gender} size="small" sx={{ bgcolor: '#555a64', color: '#f2f3f5' }} />
          {categoryName && <Chip label={categoryName} size="small" variant="outlined" sx={{ color: 'text.primary', borderColor: 'text.secondary' }} />}
          {categoryMinimumAgeEnabled && (
            <Chip label={`A partir de ${categoryMinimumAge ?? '-'} anos`} size="small" variant="outlined" sx={{ color: 'text.primary', borderColor: 'text.secondary' }} />
          )}
          <Chip
            label={event.registrationOpen ? 'Inscrições abertas' : 'Inscrições fechadas'}
            size="small"
            sx={event.registrationOpen
              ? { bgcolor: 'rgba(255,0,46,0.18)', color: '#ff8b93', border: '1px solid #ff002e' }
              : { bgcolor: '#ff002e', color: 'white', border: '1px solid #cc001e', fontWeight: 700 }}
          />
        </Stack>
        <Typography variant="body2" color="text.primary" sx={{ overflowWrap: 'anywhere' }}>
          {formatDate(event.registrationStartAt)} — {formatDate(event.registrationEndAt)}
        </Typography>
        <Link
          href={`/event/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ mt: 'auto', pt: 1.25, display: 'inline-flex', alignItems: 'center', gap: 0.5, maxWidth: '100%' }}
          variant="body2"
        >
          <OpenInNewIcon fontSize="inherit" />
          Ver página pública
        </Link>
      </CardContent>
    </>
  );

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          {content}
        </CardActionArea>
      ) : (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{content}</Box>
      )}
    </Card>
  );
}
