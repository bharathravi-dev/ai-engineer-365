import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import WeekendIcon from '@mui/icons-material/Weekend';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTrackStore } from '../trackStore';
import { useDashboardStore } from '../store';
import PageHeader from '../components/PageHeader';
import EnrollDialog from '../components/EnrollDialog';
import { generateSchedule } from '../lib/schedule';
import { buildIcs, downloadIcs } from '../lib/ics';

const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const isPast = (d: Date) => d < new Date(new Date().toDateString());

export default function PlannerSchedulePage() {
  const { current, enrollments, status, loadEnrollments, loadTrackState, toggleDone } = useTrackStore();
  const isDoneStatus = (id: string) => status[id] === 'done';
  const user = useDashboardStore((s) => s.user);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const trackId = current?.track.id;
  useEffect(() => {
    if (user && trackId) {
      void loadEnrollments();
      void loadTrackState(trackId);
    }
  }, [user, trackId, loadEnrollments, loadTrackState]);

  const enrollment = trackId ? enrollments[trackId] : undefined;
  const schedule = useMemo(
    () => (current && enrollment ? generateSchedule(current.modules, enrollment) : []),
    [current, enrollment],
  );

  if (!user) {
    return (
      <Box>
        <PageHeader overline="Day planner" title="Sign in to plan your days" />
        <Alert severity="info" action={<Button color="inherit" size="small" href="#login">Sign in</Button>}>
          The day-by-day planner schedules your roadmap around your study hours — available once you sign in and enroll.
        </Alert>
      </Box>
    );
  }
  if (!current) {
    return (
      <Box>
        <PageHeader overline="Day planner" title="Pick a roadmap first" />
        <Alert severity="info" action={<Button color="inherit" size="small" href="#catalog">Explore</Button>}>
          Choose a roadmap, then start it to generate your personalized day-by-day plan.
        </Alert>
      </Box>
    );
  }
  if (!enrollment) {
    return (
      <Box>
        <PageHeader overline="Day planner" title={`${current.track.icon} ${current.track.title}`} />
        <Alert severity="info" sx={{ mb: 2 }}>You haven't started this roadmap yet. Set your study hours to generate the plan.</Alert>
        <Button variant="contained" onClick={() => setEnrollOpen(true)}>Set up my plan</Button>
        <EnrollDialog open={enrollOpen} onClose={() => setEnrollOpen(false)} track={current.track} />
      </Box>
    );
  }

  const total = schedule.reduce((n, d) => n + d.items.length, 0);
  const done = schedule.reduce((n, d) => n + d.items.filter((it) => isDoneStatus(it.topic.id)).length, 0);
  const finish = schedule.length ? schedule[schedule.length - 1].date : null;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Box>
      <PageHeader
        overline="Day planner"
        title={`${current.track.icon}  ${current.track.title}`}
        subtitle="Every concept scheduled day by day around your study hours. Completed concepts stay on their day."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              disabled={schedule.length === 0}
              onClick={() => downloadIcs(`skillmap-${current.track.slug}.ics`, buildIcs(current.track.title, schedule))}
            >
              Add to calendar
            </Button>
            <Button variant="outlined" onClick={() => setEnrollOpen(true)}>Adjust hours</Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">{done} of {total} concepts complete</Typography>
            <Typography variant="subtitle2">{pct}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 99, mb: 2 }} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            <Chip size="small" variant="outlined" label={`${schedule.length} study days`} />
            <Chip size="small" variant="outlined" label={`${enrollment.weekday_hours}h weekdays · ${enrollment.weekend_hours}h weekends`} />
            {finish && <Chip size="small" color="success" variant="outlined" label={`Finish by ${fmt(finish)}`} />}
          </Stack>
        </CardContent>
      </Card>

      {schedule.length === 0 ? (
        <Alert severity="info">This roadmap has no concepts yet.</Alert>
      ) : (
        <Stack spacing={1.25}>
          {schedule.map((day, i) => {
            const dayDone = day.items.every((it) => isDoneStatus(it.topic.id));
            return (
              <Card key={i} sx={{ borderLeft: (t) => `3px solid ${dayDone ? t.palette.success.main : day.isWeekend ? t.palette.warning.main : t.palette.primary.main}`, opacity: isPast(day.date) && !dayDone ? 0.85 : 1 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="subtitle2">Day {i + 1}</Typography>
                      <Typography variant="body2" color="text.secondary">· {fmt(day.date)}</Typography>
                      {day.isWeekend && <Chip size="small" color="warning" variant="outlined" icon={<WeekendIcon />} label="Weekend" />}
                      {dayDone && <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Done" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{day.usedHours}h / {day.budgetHours}h</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Stack spacing={0.5}>
                    {day.items.map(({ topic, moduleTitle }) => {
                      const isDone = isDoneStatus(topic.id);
                      return (
                        <Stack key={topic.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Box
                            component="button"
                            onClick={() => toggleDone(topic.id)}
                            sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0, display: 'flex', color: isDone ? 'success.main' : 'text.disabled' }}
                            aria-label="toggle complete"
                          >
                            {isDone ? <CheckCircleIcon fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                          </Box>
                          <Typography variant="body2" sx={{ flexGrow: 1, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                            {topic.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{moduleTitle}</Typography>
                          <Chip size="small" variant="outlined" label={`${topic.est_hours}h`} sx={{ height: 20 }} />
                        </Stack>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <EnrollDialog open={enrollOpen} onClose={() => setEnrollOpen(false)} track={current.track} existing={enrollment} />
    </Box>
  );
}
