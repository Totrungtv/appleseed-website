-- Apple Seed Community Forum V1
-- Separate migration for the technician community/PANIC forum.
-- Applied to Supabase project nuismqcjyutqigdydfkg.

create table if not exists public.community_cases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 180),
  model text not null default '',
  platform text not null default 'iphone' check (platform in ('iphone','ipad','android','other')),
  fault_type text not null default 'PANIC / Kernel',
  panic_log text,
  boot_current text,
  vbat text,
  diode_resistance text,
  i2c_status text,
  area text,
  description text,
  image_url text,
  status text not null default 'open' check (status in ('open','solved','verified','closed')),
  verified boolean not null default false,
  pinned boolean not null default false,
  replies_count integer not null default 0 check (replies_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_case_replies (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.community_cases(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  is_solution boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_cases_created_idx on public.community_cases(created_at desc);
create index if not exists community_cases_model_idx on public.community_cases(model);
create index if not exists community_cases_status_idx on public.community_cases(status);
create index if not exists community_case_replies_case_idx on public.community_case_replies(case_id,created_at);

create or replace function public.community_touch_updated_at()
returns trigger language plpgsql security definer set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists community_cases_updated_at on public.community_cases;
create trigger community_cases_updated_at before update on public.community_cases
for each row execute function public.community_touch_updated_at();

create or replace function public.community_sync_reply_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.community_cases set replies_count=replies_count+1,updated_at=now() where id=new.case_id;
    return new;
  elsif tg_op='DELETE' then
    update public.community_cases set replies_count=greatest(0,replies_count-1),updated_at=now() where id=old.case_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists community_case_replies_count on public.community_case_replies;
create trigger community_case_replies_count after insert or delete on public.community_case_replies
for each row execute function public.community_sync_reply_count();

alter table public.community_cases enable row level security;
alter table public.community_case_replies enable row level security;

drop policy if exists community_cases_member_select on public.community_cases;
create policy community_cases_member_select on public.community_cases
for select to authenticated using (
  exists(select 1 from public.member_accounts m where m.user_id=auth.uid()) or public.apple_seed_is_admin()
);

drop policy if exists community_cases_member_insert on public.community_cases;
create policy community_cases_member_insert on public.community_cases
for insert to authenticated with check (
  author_id=auth.uid() and exists(select 1 from public.member_accounts m where m.user_id=auth.uid())
);

drop policy if exists community_cases_author_update on public.community_cases;
create policy community_cases_author_update on public.community_cases
for update to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff())
with check (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_cases_author_delete on public.community_cases;
create policy community_cases_author_delete on public.community_cases
for delete to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_case_replies_member_select on public.community_case_replies;
create policy community_case_replies_member_select on public.community_case_replies
for select to authenticated using (
  exists(select 1 from public.community_cases c where c.id=case_id)
  and (exists(select 1 from public.member_accounts m where m.user_id=auth.uid()) or public.apple_seed_is_admin())
);

drop policy if exists community_case_replies_member_insert on public.community_case_replies;
create policy community_case_replies_member_insert on public.community_case_replies
for insert to authenticated with check (
  author_id=auth.uid()
  and exists(select 1 from public.member_accounts m where m.user_id=auth.uid())
  and exists(select 1 from public.community_cases c where c.id=case_id)
);

drop policy if exists community_case_replies_author_update on public.community_case_replies;
create policy community_case_replies_author_update on public.community_case_replies
for update to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff())
with check (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_case_replies_author_delete on public.community_case_replies;
create policy community_case_replies_author_delete on public.community_case_replies
for delete to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());
