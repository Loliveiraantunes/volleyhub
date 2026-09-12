import { Box, Fade } from '@mui/material';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2000 }: Readonly<SplashScreenProps>) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <Fade in={show} timeout={1000}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#1a1a1a',
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2a1a2a 100%)',
          zIndex: 9999,
          pointerEvents: show ? 'auto' : 'none',
        }}
      >
        <Box
          sx={{
            animation: 'fadeInScale 0.8s ease-out',
            '@keyframes fadeInScale': {
              from: {
                opacity: 0,
                transform: 'scale(0.8)',
              },
              to: {
                opacity: 1,
                transform: 'scale(1)',
              },
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <img
            src="/logo.svg"
            alt="Dyoni Moura Logo"
            style={{
              height: '200px',
              width: 'auto',
              filter: 'drop-shadow(0 8px 24px rgba(255, 0, 46, 0.3))',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            <span style={{ color: '#ffffff' }}>DYONI</span>
            <span style={{ color: '#ff002e' }}>MOURA</span>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}
