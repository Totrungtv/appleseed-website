-- Apple Seed Admin security hardening — 2026-08-27
-- Applied to Supabase as migration:
-- apple_seed_admin_security_hardening_2026_08_27
--
-- Goals:
-- 1. Only the designated Admin role can enter the main Admin Center.
-- 2. Only Admin can change website/CMS settings and user roles.
-- 3. Staff keeps operational access where explicitly permitted.
-- 4. Remove broad authenticated/public write access from sensitive business tables.
--
-- The authoritative migration was applied through Supabase's migration system.
-- This repository file is the audit record of the change.

create or replace function public.apple_seed_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.apple_seed_is_admin() from public;
grant execute on function public.apple_seed_is_admin() to authenticated;

create or replace function public.apple_seed_protect_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.apple_seed_is_admin()
     and coalesce(new.role,'') is distinct from coalesce(old.role,'') then
    raise exception 'Không được tự thay đổi quyền tài khoản.';
  end if;
  return new;
end;
$$;

create or replace function public.apple_seed_protect_profile_role_v207()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.apple_seed_is_admin()
     and coalesce(new.role,'') is distinct from coalesce(old.role,'') then
    raise exception 'Không được tự thay đổi quyền tài khoản.';
  end if;
  return new;
end;
$$;

-- Website/CMS: Admin only.
drop policy if exists "Admin can manage site content" on public.site_content;
drop policy if exists "Authenticated can delete site content" on public.site_content;
drop policy if exists "Authenticated can insert site content" on public.site_content;
drop policy if exists "Authenticated can read site content" on public.site_content;
drop policy if exists "Authenticated can update site content" on public.site_content;
create policy "apple_seed_site_content_admin_only" on public.site_content
for all to authenticated using (public.apple_seed_is_admin())
with check (public.apple_seed_is_admin());

drop policy if exists "site_home_sections_security_admin_delete" on public.site_home_sections;
drop policy if exists "site_home_sections_security_admin_insert" on public.site_home_sections;
drop policy if exists "site_home_sections_security_admin_update" on public.site_home_sections;
create policy "site_home_sections_admin_only" on public.site_home_sections
for all to authenticated using (public.apple_seed_is_admin())
with check (public.apple_seed_is_admin());

drop policy if exists "site_nav_security_admin_delete" on public.site_nav_items;
drop policy if exists "site_nav_security_admin_insert" on public.site_nav_items;
drop policy if exists "site_nav_security_admin_read" on public.site_nav_items;
drop policy if exists "site_nav_security_admin_update" on public.site_nav_items;
create policy "site_nav_admin_only" on public.site_nav_items
for all to authenticated using (public.apple_seed_is_admin())
with check (public.apple_seed_is_admin());

drop policy if exists "site_theme_security_admin_delete" on public.site_theme_settings;
drop policy if exists "site_theme_security_admin_insert" on public.site_theme_settings;
drop policy if exists "site_theme_security_admin_update" on public.site_theme_settings;
create policy "site_theme_admin_only" on public.site_theme_settings
for all to authenticated using (public.apple_seed_is_admin())
with check (public.apple_seed_is_admin());

-- Sensitive operational data: Admin/Staff only.
drop policy if exists "product_images_admin_all" on public.product_images;
create policy "product_images_staff_admin" on public.product_images
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "shop_part_categories_auth_all" on public.shop_part_categories;
create policy "shop_part_categories_staff_admin" on public.shop_part_categories
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "shop_part_models_authenticated_all" on public.shop_part_models;
create policy "shop_part_models_staff_admin" on public.shop_part_models
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "authenticated parts all" on public.shop_parts;
drop policy if exists "shop_admin_access" on public.shop_parts;
create policy "shop_parts_staff_admin" on public.shop_parts
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "authenticated can update customer leads" on public.store_customer_leads;
drop policy if exists "authenticated can view customer leads" on public.store_customer_leads;
create policy "store_customer_leads_staff_admin" on public.store_customer_leads
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "authenticated warranties all" on public.warranty_orders;
create policy "warranty_orders_staff_admin" on public.warranty_orders
for all to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());

drop policy if exists "repair_bookings_authenticated_delete" on public.repair_bookings;
drop policy if exists "repair_bookings_authenticated_select" on public.repair_bookings;
drop policy if exists "repair_bookings_authenticated_update" on public.repair_bookings;
create policy "repair_bookings_staff_admin_select" on public.repair_bookings
for select to authenticated using (public.apple_seed_is_admin_or_staff());
create policy "repair_bookings_staff_admin_update" on public.repair_bookings
for update to authenticated using (public.apple_seed_is_admin_or_staff())
with check (public.apple_seed_is_admin_or_staff());
create policy "repair_bookings_staff_admin_delete" on public.repair_bookings
for delete to authenticated using (public.apple_seed_is_admin_or_staff());

-- Profiles: users may edit their own profile fields, but only Admin can
-- change roles/delete profiles. The trigger above blocks role escalation.
drop policy if exists "apple_seed_profiles_update_v207" on public.profiles;
drop policy if exists "apple_seed_profiles_delete_v207" on public.profiles;
create policy "apple_seed_profiles_update_safe" on public.profiles
for update to authenticated
using ((id = auth.uid()) or public.apple_seed_is_admin())
with check ((id = auth.uid()) or public.apple_seed_is_admin());
create policy "apple_seed_profiles_delete_admin" on public.profiles
for delete to authenticated using (public.apple_seed_is_admin());
