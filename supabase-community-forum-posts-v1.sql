-- Apple Seed Community Forum Posts V1
-- Generic technician forum: repair cases, software, hardware, tools and phone-industry sharing.
create table if not exists public.community_forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('repair','software','hardware','tools','knowledge','question','sharing')),
  title text not null check (char_length(title) between 5 and 180),
  body text not null check (char_length(body) between 1 and 20000),
  model text not null default '',
  platform text not null default 'iphone' check (platform in ('iphone','ipad','android','other')),
  image_url text,
  resource_url text,
  status text not null default 'published' check (status in ('published','hidden','locked')),
  pinned boolean not null default false,
  replies_count integer not null default 0 check (replies_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_forum_post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_forum_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create index if not exists community_forum_posts_created_idx on public.community_forum_posts(created_at desc);
create index if not exists community_forum_posts_category_idx on public.community_forum_posts(category);
create index if not exists community_forum_posts_model_idx on public.community_forum_posts(model);
create index if not exists community_forum_post_replies_post_idx on public.community_forum_post_replies(post_id,created_at);

create or replace function public.community_forum_touch_updated_at()
returns trigger language plpgsql security definer set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists community_forum_posts_updated_at on public.community_forum_posts;
create trigger community_forum_posts_updated_at before update on public.community_forum_posts
for each row execute function public.community_forum_touch_updated_at();

create or replace function public.community_forum_sync_reply_count()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    update public.community_forum_posts set replies_count=replies_count+1,updated_at=now() where id=new.post_id;
    return new;
  elsif tg_op='DELETE' then
    update public.community_forum_posts set replies_count=greatest(0,replies_count-1),updated_at=now() where id=old.post_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists community_forum_post_replies_count on public.community_forum_post_replies;
create trigger community_forum_post_replies_count after insert or delete on public.community_forum_post_replies
for each row execute function public.community_forum_sync_reply_count();

alter table public.community_forum_posts enable row level security;
alter table public.community_forum_post_replies enable row level security;

drop policy if exists community_forum_posts_select on public.community_forum_posts;
create policy community_forum_posts_select on public.community_forum_posts
for select to authenticated using (
  status='published' or public.apple_seed_is_admin_or_staff()
);

drop policy if exists community_forum_posts_insert on public.community_forum_posts;
create policy community_forum_posts_insert on public.community_forum_posts
for insert to authenticated with check (
  author_id=auth.uid() and exists(select 1 from public.member_accounts m where m.user_id=auth.uid())
);

drop policy if exists community_forum_posts_update on public.community_forum_posts;
create policy community_forum_posts_update on public.community_forum_posts
for update to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff())
with check (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_forum_posts_delete on public.community_forum_posts;
create policy community_forum_posts_delete on public.community_forum_posts
for delete to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_forum_post_replies_select on public.community_forum_post_replies;
create policy community_forum_post_replies_select on public.community_forum_post_replies
for select to authenticated using (exists(select 1 from public.community_forum_posts p where p.id=post_id));

drop policy if exists community_forum_post_replies_insert on public.community_forum_post_replies;
create policy community_forum_post_replies_insert on public.community_forum_post_replies
for insert to authenticated with check (
  author_id=auth.uid()
  and exists(select 1 from public.member_accounts m where m.user_id=auth.uid())
  and exists(select 1 from public.community_forum_posts p where p.id=post_id and p.status='published')
);

drop policy if exists community_forum_post_replies_update on public.community_forum_post_replies;
create policy community_forum_post_replies_update on public.community_forum_post_replies
for update to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff())
with check (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());

drop policy if exists community_forum_post_replies_delete on public.community_forum_post_replies;
create policy community_forum_post_replies_delete on public.community_forum_post_replies
for delete to authenticated using (author_id=auth.uid() or public.apple_seed_is_admin_or_staff());
