import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTrackStore } from '../trackStore';
import { useDashboardStore } from '../store';
import PageHeader from '../components/PageHeader';
import EnrollDialog from '../components/EnrollDialog';
import TopicDrawer from '../components/TopicDrawer';
import RoadmapGraph from '../components/RoadmapGraph';
import RoadmapList from '../components/RoadmapList';
import type { Topic } from '../lib/api';

type Selected = { topic: Topic; moduleTitle: string; index: number };

export default function TrackRoadmapPage({ slug }: { slug?: string }) {
  const {
    current, currentLoading, loadTrack, enrollments, loadEnrollments, loadTrackState,
    status, notes, setTopicStatus, saveTopicNote, error,
  } = useTrackStore();
  const user = useDashboardStore((s) => s.user);
  const canTrack = Boolean(user);

  const [view, setView] = useState<'graph' | 'list'>('graph');
  const [hideDone, setHideDone] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);

  useEffect(() => { if (slug) void loadTrack(slug); }, [slug, loadTrack]);

  const trackId = current?.track.id;
  useEffect(() => {
    if (user && trackId) { void loadEnrollments(); void loadTrackState(trackId); }
  }, [user, trackId, loadEnrollments, loadTrackState]);

  const allTopics = useMemo(() => (current?.modules ?? []).flatMap((m) => m.topics), [current]);
  const doneCount = allTopics.filter((t) => status[t.id] === 'done').length;
  const pct = allTopics.length ? Math.round((doneCount / allTopics.length) * 100) : 0;
  const enrollment = trackId ? enrollments[trackId] : undefined;

  if (currentLoading && !current) {
    return <Box><PageHeader overline="Roadmap" title="Loading…" /><LinearProgress /></Box>;
  }
  if (!current) {
    return (
      <Box>
        <PageHeader overline="Roadmap" title="Roadmap not found" />
        <Alert severity="error">{error ?? 'That roadmap could not be loaded.'}</Alert>
        <Button sx={{ mt: 2 }} href="#catalog">Back to all roadmaps</Button>
      </Box>
    );
  }

  const { track, modules } = current;
  const accent = track.color;

  return (
    <Box>
      <PageHeader overline="Roadmap" title={`${track.icon}  ${track.title}`} subtitle={track.description} />

      {/* Hero: progress + plan */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${accent}22)` }} />
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Box sx={{ flexGrow: 1, minWidth: 220 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'baseline', mb: 1 }}>
                <Typography sx={{ fontFamily: '"Plus Jakarta Sans"', fontWeight: 800, fontSize: 28 }}>{pct}%</Typography>
                <Typography variant="body2" color="text.secondary">{doneCount} of {allTopics.length} concepts complete</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 99 }} />
            </Box>
            <Stack direction="row" spacing={1}>
              {!canTrack ? (
                <Button variant="contained" href="#login">Sign in to start</Button>
              ) : enrollment ? (
                <>
                  <Button variant="contained" startIcon={<CalendarMonthIcon />} href="#planner">Day plan</Button>
                  <Button variant="outlined" onClick={() => setEnrollOpen(true)}>Adjust plan</Button>
                </>
              ) : (
                <Button variant="contained" size="large" onClick={() => setEnrollOpen(true)}>Start this roadmap</Button>
              )}
            </Stack>
          </Stack>
          {canTrack && enrollment && (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 0.75 }}>
              <Chip size="small" variant="outlined" label={`Starts ${enrollment.start_date}`} />
              <Chip size="small" variant="outlined" label={`${enrollment.weekday_hours}h / weekday`} />
              <Chip size="small" variant="outlined" label={`${enrollment.weekend_hours}h / weekend day`} />
            </Stack>
          )}
        </CardContent>
      </Card>

      {!canTrack && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }} action={<Button color="inherit" size="small" href="#login">Sign in</Button>}>
          Browsing as a guest — open any concept to see its materials. Sign in to track progress and build your day plan.
        </Alert>
      )}

      {/* View switch: graph journey vs accordion list */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" color="text.secondary">Tap any concept to see what to study and its reference materials.</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {canTrack && (
            <ToggleButton size="small" value="hide" selected={hideDone} onChange={() => setHideDone((v) => !v)} sx={{ textTransform: 'none', px: 1.5, py: 0.5 }}>
              {hideDone ? 'Show all' : 'Hide finished'}
            </ToggleButton>
          )}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v) => v && setView(v)}
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, gap: 0.5 } }}
          >
            <ToggleButton value="graph"><AccountTreeIcon fontSize="small" /> Journey</ToggleButton>
            <ToggleButton value="list"><ViewListIcon fontSize="small" /> List</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {view === 'graph' ? (
        <RoadmapGraph key={track.id} modules={modules} status={status} accent={accent} hideDone={hideDone} onSelect={setSelected} />
      ) : (
        <RoadmapList key={track.id} modules={modules} status={status} accent={accent} hideDone={hideDone} onSelect={setSelected} />
      )}

      <TopicDrawer
        topic={selected?.topic ?? null}
        moduleTitle={selected?.moduleTitle ?? ''}
        index={selected?.index ?? null}
        status={selected ? status[selected.topic.id] ?? 'todo' : 'todo'}
        note={selected ? notes[selected.topic.id] ?? '' : ''}
        canTrack={canTrack}
        onClose={() => setSelected(null)}
        onSetStatus={(s) => selected && setTopicStatus(selected.topic.id, s)}
        onSaveNote={(v) => selected && saveTopicNote(selected.topic.id, v)}
      />

      <EnrollDialog
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        track={track}
        existing={enrollment}
        onSaved={(wasNew) => setToast(wasNew ? 'Roadmap started — your day plan is ready.' : 'Plan updated — your day plan was rescheduled.')}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)} action={<Button color="inherit" size="small" href="#planner">View plan</Button>}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
