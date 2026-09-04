import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

export const theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: '#e63946',
        light: '#ff5964',
        dark: '#b92330',
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
          body: { minHeight: '100%', backgroundColor: '#3a3d43' },
          '#root': { minHeight: '100vh' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 800, borderRadius: 3 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none', borderRadius: 3, backgroundColor: '#464950' } },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: 3, backgroundColor: '#464950' } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 3, fontWeight: 700 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 3, color: '#f2f3f5' },
          notchedOutline: { borderColor: '#727782' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: '#d0d3da',
            '&:hover': { color: '#ffffff', backgroundColor: 'rgba(230,57,70,0.14)' },
            '&.Mui-disabled': { color: '#777c87' },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { color: '#d0d3da', '&.Mui-selected': { color: '#ff5964' } },
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
