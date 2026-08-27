-- Apple Seed Community PANIC Case Images V1
-- Separate migration: storage for real repair-case photos.
-- Stores the Storage object path in community_cases.image_url for backward compatibility.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'community-cases',
  'community-cases',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types,
    public=excluded.public;

drop policy if exists "community_cases_image_select" on storage.objects;
create policy "community_cases_image_select"
on storage.objects for select to authenticated
using (
  bucket_id='community-cases'
  and exists (
    select 1 from public.member_accounts m
    where m.user_id=auth.uid()
  )
);

drop policy if exists "community_cases_image_insert" on storage.objects;
create policy "community_cases_image_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id='community-cases'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.member_accounts m
    where m.user_id=auth.uid()
  )
);

drop policy if exists "community_cases_image_update" on storage.objects;
create policy "community_cases_image_update"
on storage.objects for update to authenticated
using (
  bucket_id='community-cases'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.member_accounts m
    where m.user_id=auth.uid()
  )
)
with check (
  bucket_id='community-cases'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.member_accounts m
    where m.user_id=auth.uid()
  )
);

drop policy if exists "community_cases_image_delete" on storage.objects;
create policy "community_cases_image_delete"
on storage.objects for delete to authenticated
using (
  bucket_id='community-cases'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.member_accounts m
    where m.user_id=auth.uid()
  )
);
