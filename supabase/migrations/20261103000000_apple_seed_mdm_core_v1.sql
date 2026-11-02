create table if not exists public.mdm_devices (
 id uuid primary key default gen_random_uuid(),
 device_name text not null,
 platform text not null check (platform in ('ios','ipados','android')),
 model text, serial_number text unique, imei text, udid text,
 ownership text not null default 'company' check (ownership in ('company','personal','customer')),
 enrollment_type text not null default 'manual' check (enrollment_type in ('manual','apple_business_manager','apple_configurator','android_fully_managed','android_work_profile','other')),
 management_status text not null default 'not_enrolled' check (management_status in ('not_enrolled','pending','enrolled','removed')),
 connectivity_status text not null default 'unknown' check (connectivity_status in ('online','offline','unknown')),
 last_seen_at timestamptz, notes text, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.mdm_activity_logs (
 id bigint generated always as identity primary key,
 device_id uuid references public.mdm_devices(id) on delete set null,
 actor_id uuid references auth.users(id) on delete set null,
 event_type text not null, details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.mdm_devices enable row level security;
alter table public.mdm_activity_logs enable row level security;
create policy "MDM admins manage devices" on public.mdm_devices for all to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
with check (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "MDM admins read activity" on public.mdm_activity_logs for select to authenticated
using (exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create policy "MDM admins create activity" on public.mdm_activity_logs for insert to authenticated
with check (actor_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
create index if not exists mdm_devices_platform_idx on public.mdm_devices(platform);
create index if not exists mdm_devices_status_idx on public.mdm_devices(management_status);
create index if not exists mdm_activity_device_created_idx on public.mdm_activity_logs(device_id,created_at desc);
grant select,insert,update,delete on public.mdm_devices to authenticated;
grant select,insert on public.mdm_activity_logs to authenticated;
