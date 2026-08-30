-- Apple Seed Visual Site Builder V2
-- Versioned CMS with publish/rollback and private editor writes.
create table if not exists public.site_builder_versions (
  id uuid primary key default gen_random_uuid(),
  site_key text not null default 'default',
  version_no bigint not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index if not exists site_builder_versions_site_version_uq
  on public.site_builder_versions(site_key, version_no);
create unique index if not exists site_builder_one_published_uq
  on public.site_builder_versions(site_key) where status='published';

alter table public.site_builder_versions enable row level security;
drop policy if exists site_builder_public_published on public.site_builder_versions;
create policy site_builder_public_published
  on public.site_builder_versions for select
  to anon, authenticated
  using (status='published');

drop policy if exists site_builder_staff_select on public.site_builder_versions;
create policy site_builder_staff_select
  on public.site_builder_versions for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff')));

drop policy if exists site_builder_staff_insert on public.site_builder_versions;
create policy site_builder_staff_insert
  on public.site_builder_versions for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff')));

drop policy if exists site_builder_staff_update on public.site_builder_versions;
create policy site_builder_staff_update
  on public.site_builder_versions for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff')))
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff')));

create or replace function public.apple_seed_builder_next_version(p_site_key text)
returns bigint
language sql
stable
as $$
  select coalesce(max(version_no),0)+1 from public.site_builder_versions where site_key=p_site_key
$$;

create or replace function public.apple_seed_builder_publish(p_config jsonb, p_site_key text default 'default')
returns public.site_builder_versions
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  v bigint;
  row public.site_builder_versions;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.role in ('admin','staff')) then
    raise exception 'BUILDER_FORBIDDEN';
  end if;
  v := public.apple_seed_builder_next_version(p_site_key);
  update public.site_builder_versions set status='archived' where site_key=p_site_key and status='published';
  insert into public.site_builder_versions(site_key,version_no,config,status,created_by,published_at)
  values(p_site_key,v,coalesce(p_config,'{}'::jsonb),'published',uid,now())
  returning * into row;
  return row;
end;
$$;

create or replace function public.apple_seed_builder_rollback(p_version_id uuid)
returns public.site_builder_versions
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  src public.site_builder_versions;
  row public.site_builder_versions;
  v bigint;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.role in ('admin','staff')) then
    raise exception 'BUILDER_FORBIDDEN';
  end if;
  select * into src from public.site_builder_versions where id=p_version_id;
  if not found then raise exception 'VERSION_NOT_FOUND'; end if;
  v := public.apple_seed_builder_next_version(src.site_key);
  update public.site_builder_versions set status='archived' where site_key=src.site_key and status='published';
  insert into public.site_builder_versions(site_key,version_no,config,status,created_by,published_at)
  values(src.site_key,v,src.config,'published',uid,now())
  returning * into row;
  return row;
end;
$$;

revoke all on function public.apple_seed_builder_publish(jsonb,text) from public;
grant execute on function public.apple_seed_builder_publish(jsonb,text) to authenticated;
revoke all on function public.apple_seed_builder_rollback(uuid) from public;
grant execute on function public.apple_seed_builder_rollback(uuid) to authenticated;

-- Image storage for Builder. Public read, editor-only write.
insert into storage.buckets(id,name,public)
values('site-images','site-images',true)
on conflict(id) do update set public=true;

drop policy if exists site_images_public_read on storage.objects;
create policy site_images_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id='site-images');

drop policy if exists site_images_staff_insert on storage.objects;
create policy site_images_staff_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id='site-images' and
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff'))
  );

drop policy if exists site_images_staff_update on storage.objects;
create policy site_images_staff_update
  on storage.objects for update to authenticated
  using (
    bucket_id='site-images' and
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff'))
  );

drop policy if exists site_images_staff_delete on storage.objects;
create policy site_images_staff_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id='site-images' and
    exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','staff'))
  );

-- Rollback:
-- drop function if exists public.apple_seed_builder_rollback(uuid);
-- drop function if exists public.apple_seed_builder_publish(jsonb,text);
-- drop function if exists public.apple_seed_builder_next_version(text);
-- drop table if exists public.site_builder_versions;
-- delete from storage.buckets where id='site-images';
