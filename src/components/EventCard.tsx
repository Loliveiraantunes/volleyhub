import { Card, CardActionArea, CardContent, CardMedia, Chip, Link, Stack, Typography } from '@mui/material';
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
          height: 140,
          backgroundColor: 'grey.200',
          backgroundImage: event.coverImage ? `url(${event.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {event.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5, mb: 1 }} flexWrap="wrap">
          <Chip label={genderLabels[event.gender] ?? event.gender} size="small" />
          {categoryName && <Chip label={categoryName} size="small" variant="outlined" />}
          {categoryMinimumAgeEnabled && (
            <Chip label={`A partir de ${categoryMinimumAge ?? '-'} anos`} size="small" variant="outlined" />
          )}
          <Chip
            label={event.registrationOpen ? 'Inscrições abertas' : 'Inscrições fechadas'}
            size="small"
            color={event.registrationOpen ? 'success' : 'default'}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatDate(event.registrationStartAt)} — {formatDate(event.registrationEndAt)}
        </Typography>
        <Link
          href={`/event/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          variant="body2"
        >
          <OpenInNewIcon fontSize="inherit" />
          Ver página pública
        </Link>
      </CardContent>
    </>
  );

  return (
    <Card variant="outlined">
      {onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}
    </Card>
  );
}
