-- Daymark habit tracker schema. Run in the Supabase SQL Editor for a new project.

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  category text not null default 'Personal'
    check (category in ('Wellbeing', 'Study', 'Health', 'Personal')),
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  constraint habit_logs_one_checkin_per_day unique (habit_id, completed_on)
);

create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, completed_on);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, delete on public.habit_logs to authenticated;

create policy "Users can read their own habits"
  on public.habits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own habits"
  on public.habits for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own habits"
  on public.habits for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own habits"
  on public.habits for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own check-ins"
  on public.habit_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own check-ins"
  on public.habit_logs for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.habits
      where habits.id = habit_logs.habit_id
        and habits.user_id = (select auth.uid())
    )
  );
create policy "Users can delete their own check-ins"
  on public.habit_logs for delete to authenticated
  using ((select auth.uid()) = user_id);
