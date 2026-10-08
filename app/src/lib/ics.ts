import type { ScheduleDay } from './schedule';

const pad = (n: number) => String(n).padStart(2, '0');
const dateStamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/** Build an iCalendar file: one all-day event per study day, listing that day's
 *  concepts. Imports into Google/Apple/Outlook Calendar. */
export function buildIcs(trackTitle: string, days: ScheduleDay[]): string {
  const now = new Date();
  const stamp = `${dateStamp(now)}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillMap//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(`SkillMap · ${trackTitle}`)}`,
  ];
  days.forEach((day, i) => {
    const start = day.date;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const titles = day.items.map((it) => `• ${it.topic.title} (${it.topic.est_hours}h)`).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:skillmap-${dateStamp(start)}-${i}@skillmap`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateStamp(start)}`,
      `DTEND;VALUE=DATE:${dateStamp(end)}`,
      `SUMMARY:${esc(`${trackTitle} — Day ${i + 1} · ${day.items.length} concept${day.items.length === 1 ? '' : 's'} (${day.usedHours}h)`)}`,
      `DESCRIPTION:${esc(titles)}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Trigger a browser download of an .ics file. */
export function downloadIcs(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
