import { useEffect } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useTrackStore } from '../trackStore';
import { useDashboardStore } from '../store';
import PageHeader from '../components/PageHeader';

export default function MyLearningPage() {
  const { summaries, summaryLoading, loadSummary, loadTrack } = useTrackStore();
  const user = useDashboardStore((s) => s.user);

  useEffect(() => { if (user) void loadSummary(); }, [user, loadSummary]);

  if (!user) {
    return (
      <Box>
        <PageHeader overline="My learning" title="Sign in to see your progress" />
        <Alert severity="info" action={<Button color="inherit" size="small" href="#login">Sign in</Button>}>
          Track progress across roadmaps and pick up where you left off once you sign in.
        </Alert>
      </Box>
    );
  }

  const firstName = user.email?.split('@')[0] ?? 'there';

  return (
    <Box>
      <PageHeader
        overline="My learning"
        title={`Welcome back, ${firstName}`}
        subtitle="Pick up where you left off, or start a new roadmap."
        action={<Button variant="outlined" href="#catalog">Browse roadmaps</Button>}
      />

      {summaryLoading && summaries.length === 0 && <LinearProgress />}

      {!summaryLoading && summaries.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>You haven't started a roadmap yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose a path — Frontend, Backend, DevOps, AI Engineer — and get a plan built around your hours.
            </Typography>
            <Button variant="contained" href="#catalog">Explore roadmaps</Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {summaries.map((s) => {
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
            const complete = s.total > 0 && s.done === s.total;
            return (
              <Grid key={s.track.id} size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', borderTop: `4px solid ${s.track.color}` }}>
                  <CardContent sx={{ p: 2.75 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                      <Box sx={{ width: 46, height: 46, borderRadius: 3, display: 'grid', placeItems: 'center', fontSize: 24, background: `${s.track.color}1a`, border: `1px solid ${s.track.color}33` }}>{s.track.icon}</Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>{s.track.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.done}/{s.total} concepts · {s.weekday_hours}h weekdays · {s.weekend_hours}h weekends</Typography>
                      </Box>
                      <Chip label={`${pct}%`} size="small" color={complete ? 'success' : 'default'} />
                    </Stack>

                    <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 99, mb: 2 }} />

                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
                      {complete ? (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>🎉 Every concept complete — nice work!</Typography>
                      ) : (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Up next</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.next?.title ?? 'Start your first concept'}</Typography>
                        </>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => { window.location.hash = `track/${s.track.slug}`; }}>
                        {complete ? 'Review' : 'Resume'}
                      </Button>
                      <Button variant="outlined" startIcon={<CalendarMonthIcon />} onClick={() => { void loadTrack(s.track.slug).then(() => { window.location.hash = 'planner'; }); }}>
                        Day plan
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
