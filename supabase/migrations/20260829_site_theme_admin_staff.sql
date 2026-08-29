-- Apple Seed: allow Admin + Staff accounts to manage Theme/Hero settings.
-- Rollback: drop site_theme_admin_staff and recreate the previous admin-only policy.

drop policy if exists site_theme_admin_only on public.site_theme_settings;
drop policy if exists site_theme_admin_staff on public.site_theme_settings;

create policy site_theme_admin_staff
on public.site_theme_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','staff')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','staff')
  )
);
