import { lazy, Suspense, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  AppBar,
  Box,
  CircularProgress,
  Container,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import SchoolIcon from '@mui/icons-material/School';
import MapIcon from '@mui/icons-material/Map';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { buildTheme } from './theme';
import { useDashboardStore, useIsAdmin } from './store';
import { useTrackStore } from './trackStore';
import ErrorBoundary from './components/ErrorBoundary';

// Route-level code splitting: each page is its own chunk, loaded on demand.
const MyLearningPage = lazy(() => import('./pages/MyLearningPage'));
const TracksCatalogPage = lazy(() => import('./pages/TracksCatalogPage'));
const TrackRoadmapPage = lazy(() => import('./pages/TrackRoadmapPage'));
const PlannerSchedulePage = lazy(() => import('./pages/PlannerSchedulePage'));
const AdminTracksPage = lazy(() => import('./pages/AdminTracksPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

const Loading = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
);

const drawerWidth = 264;
const APP_NAME = 'SkillMap';

type RouteId = 'home' | 'catalog' | 'track' | 'planner' | 'account' | 'admin' | 'login' | 'register';
const baseIds: RouteId[] = ['home', 'catalog', 'track', 'planner', 'account', 'admin', 'login', 'register'];
const authRouteIds: RouteId[] = ['login', 'register'];

function parseHash(): { base: RouteId; param?: string } {
  const raw = window.location.hash.replace(/^#/, '');
  const [base, param] = raw.split('/');
  return { base: (baseIds.includes(base as RouteId) ? (base as RouteId) : 'catalog'), param };
}

function Page({ base, param }: { base: RouteId; param?: string }) {
  switch (base) {
    case 'home':
      return <MyLearningPage />;
    case 'track':
      return <TrackRoadmapPage slug={param} />;
    case 'planner':
      return <PlannerSchedulePage />;
    case 'account':
      return <AccountPage />;
    case 'admin':
      return <AdminTracksPage />;
    default:
      return <TracksCatalogPage />;
  }
}

function App() {
  const mode = useDashboardStore((state) => state.themeMode);
  const toggleTheme = useDashboardStore((state) => state.toggleTheme);
  const initApp = useDashboardStore((state) => state.initApp);
  const supabaseEnabled = useDashboardStore((state) => state.supabaseEnabled);
  const user = useDashboardStore((state) => state.user);
  const isAdmin = useIsAdmin();
  const currentTrack = useTrackStore((s) => s.current?.track);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const [{ base: route, param }, setRoute] = useState(parseHash());
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    void initApp();
  }, [initApp]);

  type Section = { id: string; href: string; label: string; icon: ReactElement; active: boolean };
  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [];
    if (user) {
      list.push({ id: 'home', href: '#home', label: 'My learning', icon: <SchoolIcon />, active: route === 'home' });
    }
    list.push({ id: 'catalog', href: '#catalog', label: 'Explore roadmaps', icon: <ExploreIcon />, active: route === 'catalog' });
    if (currentTrack) {
      list.push({ id: 'track', href: `#track/${currentTrack.slug}`, label: 'My roadmap', icon: <MapIcon />, active: route === 'track' });
    }
    list.push({ id: 'planner', href: '#planner', label: 'Day planner', icon: <EventNoteIcon />, active: route === 'planner' });
    if (isAdmin) list.push({ id: 'admin', href: '#admin', label: 'Admin', icon: <AdminPanelSettingsIcon />, active: route === 'admin' });
    if (supabaseEnabled) {
      list.push(
        user
          ? { id: 'account', href: '#account', label: 'Account', icon: <AccountCircleIcon />, active: route === 'account' }
          : { id: 'login', href: '#login', label: 'Sign in', icon: <AccountCircleIcon />, active: false },
      );
    }
    return list;
  }, [route, currentTrack, isAdmin, supabaseEnabled, user]);

  const isAuthRoute = authRouteIds.includes(route);
  useEffect(() => {
    if (user && isAuthRoute) window.location.hash = 'home';
  }, [user, isAuthRoute]);

  // Signed-in users land on "My learning" instead of the public catalog.
  useEffect(() => {
    if (user && !window.location.hash) window.location.hash = 'home';
  }, [user]);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setMobileOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Standalone auth pages render outside the sidebar shell (all hooks above).
  if (supabaseEnabled && isAuthRoute && !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<Loading />}>
          {route === 'register' ? <RegisterPage /> : <LoginPage />}
        </Suspense>
      </ThemeProvider>
    );
  }

  const drawer = (
    <Box sx={{ height: '100%', color: '#c7d2e5', background: '#0b0f1c', borderRight: '1px solid rgba(148,163,184,0.10)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Stack direction="row" spacing={1.3} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'grid', placeItems: 'center', fontSize: 18, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 6px 16px rgba(99,102,241,0.45)' }}>🗺️</Box>
          <Box>
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1.1 }}>{APP_NAME}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.85)' }}>Study roadmaps</Typography>
          </Box>
        </Stack>
      </Box>
      <List sx={{ px: 1.25, flexGrow: 1 }}>
        <Typography variant="overline" sx={{ px: 1.5, color: 'rgba(148,163,184,0.6)' }}>Menu</Typography>
        {sections.map((section) => (
          <ListItemButton
            key={section.id}
            component="a"
            href={section.href}
            selected={section.active}
            sx={{
              borderRadius: 2.5, mb: 0.25, py: 0.9,
              color: section.active ? '#fff' : 'rgba(199,210,229,0.85)',
              background: section.active ? 'rgba(99,102,241,0.18)' : 'transparent',
              position: 'relative',
              '&:before': section.active ? { content: '""', position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 99, background: '#818cf8' } : {},
              '&:hover': { background: 'rgba(148,163,184,0.10)' },
              '&.Mui-selected, &.Mui-selected:hover': { background: 'rgba(99,102,241,0.20)' },
            }}
          >
            <ListItemIcon sx={{ color: section.active ? '#a5b4fc' : 'inherit', minWidth: 38 }}>{section.icon}</ListItemIcon>
            <ListItemText primary={section.label} sx={{ '& .MuiListItemText-primary': { fontWeight: section.active ? 700 : 500, fontSize: 14 } }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Box sx={{ p: 1.75, borderRadius: 3, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, display: 'block', mb: 0.25 }}>Roadmaps for every stack</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.8)', lineHeight: 1.4 }}>
            Frontend · Backend · DevOps · AI — planned around your hours.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const activeLabel = sections.find((s) => s.active)?.label ?? (route === 'track' ? 'Roadmap' : APP_NAME);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar
          position="fixed"
          elevation={0}
          color="transparent"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            backdropFilter: 'blur(8px)',
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(11,16,32,0.72)' : 'rgba(245,246,251,0.72)'),
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>{activeLabel}</Typography>
            <Tooltip title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              <IconButton onClick={toggleTheme}>{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}</IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant={isDesktop ? 'permanent' : 'temporary'}
            open={isDesktop ? true : mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: drawerWidth, border: 0, boxSizing: 'border-box' } }}
          >
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Page base={route} param={param} />
              </Suspense>
            </ErrorBoundary>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
