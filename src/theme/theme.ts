import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: '#ff002e',
        light: '#ff3349',
        dark: '#cc001e',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#34363d',
        contrastText: '#ffffff',
      },
      background: {
        default: '#3a3d43',
        paper: '#464950',
      },
      text: {
        primary: '#f2f3f5',
        secondary: '#d0d3da',
        disabled: '#9297a2',
      },
      divider: '#5a5e67',
    },
    shape: {
      borderRadius: 3,
    },
    typography: {
      fontFamily: ['Roboto', 'Arial', 'sans-serif'].join(','),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { minHeight: '100%' },
          body: {
            minHeight: '100%',
            background: 'linear-gradient(135deg, #2a2d32 0%, #3a3d43 50%, #2f3238 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255, 0, 46, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 51, 73, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(255, 0, 46, 0.05) 0%, transparent 60%)
              `,
              pointerEvents: 'none',
              zIndex: -1,
            },
          },
          '#root': { minHeight: '100vh', position: 'relative', zIndex: 1 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 800, borderRadius: 3 },
          contained: {
            background: 'linear-gradient(135deg, #ff002e 0%, #cc001e 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff3349 0%, #ff002e 100%)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'linear-gradient(135deg, rgba(70, 73, 80, 0.8) 0%, rgba(58, 61, 67, 0.9) 100%)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 0, 46, 0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'linear-gradient(135deg, rgba(70, 73, 80, 0.7) 0%, rgba(58, 61, 67, 0.85) 100%)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 0, 46, 0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 3, fontWeight: 700 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 3,
            color: '#f2f3f5',
            background: 'linear-gradient(135deg, rgba(63, 66, 72, 0.5) 0%, rgba(58, 61, 67, 0.7) 100%)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 0, 46, 0.3)',
            },
          },
          notchedOutline: { borderColor: '#727782' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: '#d0d3da',
            '&:hover': { color: '#ffffff', backgroundColor: 'rgba(255,0,46,0.14)' },
            '&.Mui-disabled': { color: '#777c87' },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { color: '#d0d3da', '&.Mui-selected': { color: '#ff3349' } },
        },
      },
      MuiTableHead: {
        styleOverrides: { root: { color: '#f2f3f5' } },
      },
      MuiTableCell: {
        styleOverrides: { root: { borderColor: '#5a5e67', color: '#f2f3f5' } },
      },
    },
  },
  ptBR,
);
