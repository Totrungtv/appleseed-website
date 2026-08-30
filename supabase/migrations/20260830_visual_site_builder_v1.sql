-- Apple Seed Visual Site Builder V1
create table if not exists public.site_builder_versions (
 id uuid primary key default gen_random_uuid(),
 site_key text not null default 'default' unique,
 config jsonb not null default '{}'::jsonb,
 is_published boolean not null default false,
 updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.site_builder_versions enable row level security;
drop policy if exists site_builder_public_published on public.site_builder_versions;
create policy site_builder_public_published on public.site_builder_versions for select to anon, authenticated using (is_published = true);
drop policy if exists site_builder_admin_staff_all on public.site_builder_versions;
create policy site_builder_admin_staff_all on public.site_builder_versions for all to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff'))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff')));
create or replace function public.site_builder_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists trg_site_builder_updated_at on public.site_builder_versions;
create trigger trg_site_builder_updated_at before update on public.site_builder_versions for each row execute function public.site_builder_set_updated_at();
insert into public.site_builder_versions(site_key,config,is_published) values('default','{}'::jsonb,false) on conflict(site_key) do nothing;
-- Rollback: drop trigger if exists trg_site_builder_updated_at on public.site_builder_versions; drop function if exists public.site_builder_set_updated_at(); drop table if exists public.site_builder_versions;