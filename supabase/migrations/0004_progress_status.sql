-- Four progress states instead of a boolean. Absence of a row = 'todo';
-- stored rows are 'in_progress' | 'done' | 'skip'.
alter table public.topic_progress add column if not exists status text;
update public.topic_progress set status = case when completed then 'done' else 'in_progress' end where status is null;
alter table public.topic_progress alter column status set default 'done';
alter table public.topic_progress alter column status set not null;
alter table public.topic_progress drop constraint if exists topic_progress_status_chk;
alter table public.topic_progress add constraint topic_progress_status_chk check (status in ('in_progress', 'done', 'skip'));
alter table public.topic_progress drop column if exists completed;
