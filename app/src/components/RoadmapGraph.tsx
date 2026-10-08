import { useState } from 'react';
import { Box, Chip, Collapse, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Module, Topic, TopicStatus } from '../lib/api';

type Selected = { topic: Topic; moduleTitle: string; index: number };

/** roadmap.sh-style vertical journey with arrow markers, grouped into
 *  collapsible module stages. The module holding the next unfinished concept
 *  starts expanded. Node color encodes status (done / in-progress / skip). */
export default function RoadmapGraph({
  modules, status, accent, hideDone, onSelect,
}: {
  modules: Module[];
  status: Record<string, TopicStatus>;
  accent: string;
  hideDone: boolean;
  onSelect: (s: Selected) => void;
}) {
  const st = (id: string): TopicStatus => status[id] ?? 'todo';
  const flat = modules.flatMap((m) => m.topics);
  const currentTopicId = flat.find((t) => st(t.id) === 'todo' || st(t.id) === 'in_progress')?.id ?? null;
  const currentModuleId = modules.find((m) => m.topics.some((t) => t.id === currentTopicId))?.id;

  const [open, setOpen] = useState<Set<string>>(
    () => new Set([modules[0]?.id, currentModuleId].filter(Boolean) as string[]),
  );
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  let step = 0;
  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', pb: 4 }}>
      {modules.map((m, mi) => {
        const done = m.topics.filter((t) => st(t.id) === 'done').length;
        const isOpen = open.has(m.id);
        const allDone = done === m.topics.length && m.topics.length > 0;
        const startStep = step;
        step += m.topics.length;
        const shown = m.topics.filter((t) => !(hideDone && (st(t.id) === 'done' || st(t.id) === 'skip')));
        return (
          <Box key={m.id} sx={{ mb: 1 }}>
            <Box
              component="button"
              onClick={() => toggle(m.id)}
              sx={{
                width: '100%', cursor: 'pointer', font: 'inherit', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 3,
                border: 1, borderColor: allDone ? 'success.main' : 'divider',
                bgcolor: `${accent}0d`, mt: mi === 0 ? 0 : 1.5,
              }}
            >
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#fff', bgcolor: allDone ? 'success.main' : accent }}>
                {allDone ? <CheckIcon sx={{ fontSize: 16 }} /> : mi + 1}
              </Box>
              <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{m.title}</Typography>
              <Chip size="small" variant="outlined" label={`${done}/${m.topics.length}`} />
              <ExpandMoreIcon sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s', color: 'text.secondary' }} />
            </Box>

            <Collapse in={isOpen}>
              <Box sx={{ pt: 1.5, px: { xs: 0, sm: 2 } }}>
                {shown.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1 }}>All concepts here are done.</Typography>
                )}
                {shown.map((topic, ti) => {
                  const s = st(topic.id);
                  const globalIndex = startStep + m.topics.indexOf(topic);
                  const isDone = s === 'done';
                  const isSkip = s === 'skip';
                  const isProg = s === 'in_progress';
                  const isCurrent = topic.id === currentTopicId;
                  const dotColor = isDone ? 'success.main' : isProg ? 'warning.main' : isCurrent ? accent : 'text.disabled';
                  return (
                    <Box key={topic.id}>
                      {ti > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.disabled', my: -0.5 }}>
                          <Box sx={{ width: 2, height: 16, bgcolor: 'divider' }} />
                          <KeyboardArrowDownIcon fontSize="small" sx={{ mt: -0.75 }} />
                        </Box>
                      )}
                      <Box
                        component="button"
                        onClick={() => onSelect({ topic, moduleTitle: m.title, index: globalIndex + 1 })}
                        sx={{
                          width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 3,
                          border: 2, borderColor: isCurrent ? accent : 'divider',
                          bgcolor: (t) => (isDone ? '#22c55e12' : t.palette.background.paper),
                          opacity: isSkip ? 0.6 : 1,
                          boxShadow: isCurrent ? `0 0 0 4px ${accent}22` : 'none',
                          transition: 'all .15s', '&:hover': { borderColor: accent },
                        }}
                      >
                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#fff', bgcolor: dotColor }}>
                          {isDone ? <CheckIcon sx={{ fontSize: 16 }} /> : globalIndex + 1}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, textDecoration: isDone || isSkip ? 'line-through' : 'none', opacity: isDone || isSkip ? 0.7 : 1 }} noWrap>
                            {topic.title}
                          </Typography>
                        </Box>
                        <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                          <Chip size="small" variant="outlined" label={`${topic.est_hours}h`} sx={{ height: 20 }} />
                          {isCurrent && <Typography variant="caption" sx={{ color: accent, fontWeight: 700, mt: 0.25 }}>Up next</Typography>}
                          {isProg && !isCurrent && <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, mt: 0.25 }}>In progress</Typography>}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}
