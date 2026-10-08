import { useEffect, useState, type ReactElement } from 'react';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';
import SchoolIcon from '@mui/icons-material/School';
import type { Topic, TopicStatus } from '../lib/api';

const STATES: { value: TopicStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'skip', label: 'Skip' },
];
const faviconUrl = (u: string) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=64`; } catch { return ''; }
};

const KIND: Record<string, { label: string; icon: ReactElement; color: string }> = {
  doc: { label: 'Documentation', icon: <MenuBookIcon fontSize="small" />, color: '#6366f1' },
  article: { label: 'Article', icon: <DescriptionIcon fontSize="small" />, color: '#0ea5e9' },
  video: { label: 'Video', icon: <OndemandVideoIcon fontSize="small" />, color: '#ef4444' },
  practice: { label: 'Practice', icon: <CodeIcon fontSize="small" />, color: '#22c55e' },
  repo: { label: 'Repository', icon: <GitHubIcon fontSize="small" />, color: '#64748b' },
  course: { label: 'Course', icon: <SchoolIcon fontSize="small" />, color: '#f59e0b' },
};

export default function TopicDrawer({
  topic, moduleTitle, index, status, note, canTrack, onClose, onSetStatus, onSaveNote,
}: {
  topic: Topic | null;
  moduleTitle: string;
  index: number | null;
  status: TopicStatus;
  note: string;
  canTrack: boolean;
  onClose: () => void;
  onSetStatus: (s: TopicStatus) => void;
  onSaveNote: (v: string) => void;
}) {
  const [draft, setDraft] = useState(note);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(note); setDirty(false); }, [note, topic?.id]);

  const commit = () => {
    if (!dirty) return;
    onSaveNote(draft);
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(topic)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 440 }, p: 0 } } }}
    >
      {topic && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="overline" color="primary">
                {index != null ? `Step ${index} · ` : ''}{moduleTitle}
              </Typography>
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Typography variant="h5" sx={{ mt: 0.5 }}>{topic.title}</Typography>
            <Chip size="small" variant="outlined" label={`~${topic.est_hours} hours`} sx={{ mt: 1.5 }} />
            {canTrack ? (
              <ToggleButtonGroup
                exclusive
                size="small"
                value={status}
                onChange={(_, v) => v && onSetStatus(v as TopicStatus)}
                sx={{ mt: 1.5, display: 'flex', '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', py: 0.5, fontSize: 12.5 } }}
              >
                {STATES.map((s) => (
                  <ToggleButton
                    key={s.value}
                    value={s.value}
                    sx={{
                      '&.Mui-selected': {
                        color: '#fff',
                        bgcolor: s.value === 'done' ? 'success.main' : s.value === 'in_progress' ? 'warning.main' : s.value === 'skip' ? 'text.disabled' : 'primary.main',
                        '&:hover': { bgcolor: s.value === 'done' ? 'success.dark' : s.value === 'in_progress' ? 'warning.dark' : 'primary.dark' },
                      },
                    }}
                  >
                    {s.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <Box sx={{ mt: 1.5 }}><Button size="small" variant="contained" href="#login">Sign in to track</Button></Box>
            )}
          </Box>

          <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>What you'll learn</Typography>
            <Typography variant="body2" color="text.secondary">{topic.description || 'No description yet.'}</Typography>

            {topic.resources.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Reference materials</Typography>
                <Stack spacing={1}>
                  {topic.resources.map((r) => {
                    const meta = KIND[r.kind] ?? KIND.doc;
                    return (
                      <Link
                        key={r.url}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2,
                          border: 1, borderColor: 'divider', color: 'text.primary',
                          transition: 'all .15s',
                          '&:hover': { borderColor: meta.color, bgcolor: `${meta.color}0d` },
                        }}
                      >
                        <Box sx={{ position: 'relative', width: 22, height: 22, flex: 'none', display: 'grid', placeItems: 'center', color: meta.color }}>
                          {meta.icon}
                          {r.kind === 'video' ? null : (
                            <Box
                              component="img"
                              src={faviconUrl(r.url)}
                              alt=""
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              sx={{ position: 'absolute', width: 18, height: 18, borderRadius: '4px', bgcolor: 'background.paper' }}
                            />
                          )}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.title}</Typography>
                          <Typography variant="caption" sx={{ color: meta.color }}>{meta.label}</Typography>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </Link>
                    );
                  })}
                </Stack>
              </>
            )}

            {canTrack && (
              <>
                <Stack direction="row" spacing={1} sx={{ mt: 3, mb: 1, alignItems: 'center' }}>
                  <Typography variant="subtitle2">My notes</Typography>
                  {saved && <Typography variant="caption" color="success.main">Saved ✓</Typography>}
                </Stack>
                <TextField
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
                  onBlur={commit}
                  placeholder="Jot down what you learned… (saved when you click away)"
                  multiline
                  minRows={4}
                  fullWidth
                  size="small"
                />
              </>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
