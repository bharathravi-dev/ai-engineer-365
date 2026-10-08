import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Module, Topic, TopicStatus } from '../lib/api';

type Selected = { topic: Topic; moduleTitle: string; index: number };

function StatusIcon({ s }: { s: TopicStatus }) {
  if (s === 'done') return <CheckCircleIcon fontSize="small" color="success" />;
  if (s === 'in_progress') return <TimelapseIcon fontSize="small" color="warning" />;
  if (s === 'skip') return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
  return <RadioButtonUncheckedIcon fontSize="small" sx={{ opacity: 0.4 }} />;
}

/** Accordion representation of the journey (module → topics), collapsible. */
export default function RoadmapList({
  modules, status, accent, hideDone, onSelect,
}: {
  modules: Module[];
  status: Record<string, TopicStatus>;
  accent: string;
  hideDone: boolean;
  onSelect: (s: Selected) => void;
}) {
  const st = (id: string): TopicStatus => status[id] ?? 'todo';
  let step = 0;
  return (
    <Box>
      {modules.map((m, mi) => {
        const done = m.topics.filter((t) => st(t.id) === 'done').length;
        const shown = m.topics.filter((t) => !(hideDone && (st(t.id) === 'done' || st(t.id) === 'skip')));
        const startStep = step;
        step += m.topics.length;
        return (
          <Accordion key={m.id} defaultExpanded={mi === 0} disableGutters sx={{ mb: 1.25, borderRadius: 3, border: 1, borderColor: 'divider', '&:before': { display: 'none' }, boxShadow: 'none' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexGrow: 1 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, color: '#fff', bgcolor: accent }}>{mi + 1}</Box>
                <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{m.title}</Typography>
                <Chip size="small" variant="outlined" label={`${done}/${m.topics.length}`} sx={{ mr: 1 }} />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 2, pb: 1.5 }}>
              <Stack spacing={0.5}>
                {shown.map((topic) => {
                  const gi = startStep + m.topics.indexOf(topic);
                  const s = st(topic.id);
                  const struck = s === 'done' || s === 'skip';
                  return (
                    <Box
                      key={topic.id}
                      component="button"
                      onClick={() => onSelect({ topic, moduleTitle: m.title, index: gi + 1 })}
                      sx={{
                        width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2,
                        border: 0, bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <StatusIcon s={s} />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500, textDecoration: struck ? 'line-through' : 'none', opacity: struck ? 0.6 : 1 }}>
                        {topic.title}
                      </Typography>
                      <Chip size="small" variant="outlined" label={`${topic.est_hours}h`} sx={{ height: 20 }} />
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Box>
                  );
                })}
                {shown.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>All concepts here are done.</Typography>}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
