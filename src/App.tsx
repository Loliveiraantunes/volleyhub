import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { theme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { SelectedEventProvider } from './contexts/SelectedEventContext';
import { AppRoutes } from './routes/AppRoutes';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <BrowserRouter>
          <AuthProvider>
            <SelectedEventProvider>
              <AppRoutes />
            </SelectedEventProvider>
          </AuthProvider>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
