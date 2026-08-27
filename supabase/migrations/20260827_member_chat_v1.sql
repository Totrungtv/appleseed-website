-- Apple Seed Member Chat V1
-- Direct/group chat + online/offline presence. Run against the Apple Seed Supabase project.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group')),
  name text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.chat_participants (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key(conversation_id,user_id)
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists chat_participants_user_idx on public.chat_participants(user_id,conversation_id);
create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id,created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

create or replace function public.chat_is_participant(p_conversation_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.chat_participants where conversation_id=p_conversation_id and user_id=p_user_id);
$$;

create or replace function public.chat_touch_presence()
returns void language sql security definer set search_path=public as $$
update public.member_accounts set last_seen_at=now(),updated_at=now() where user_id=auth.uid();
$$;

create or replace function public.chat_list_members()
returns table(id uuid,full_name text,role text,online boolean,last_seen_at timestamptz)
language sql security definer stable set search_path=public as $$
select p.id,p.full_name,p.role,coalesce(ma.last_seen_at>now()-interval '5 minutes',false),ma.last_seen_at
from public.profiles p left join public.member_accounts ma on ma.user_id=p.id
where auth.uid() is not null and p.role='member'
order by coalesce(ma.last_seen_at>now()-interval '5 minutes',false) desc,lower(coalesce(p.full_name,'')),p.created_at;
$$;

create or replace function public.chat_get_or_create_direct(p_other_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare me uuid:=auth.uid(); cid uuid;
begin
 if me is null or p_other_user_id is null or me=p_other_user_id then raise exception 'INVALID_CHAT_USER'; end if;
 if not exists(select 1 from public.profiles where id=p_other_user_id and role='member') then raise exception 'USER_NOT_AVAILABLE'; end if;
 select c.id into cid from public.chat_conversations c
 where c.type='direct' and public.chat_is_participant(c.id,me) and public.chat_is_participant(c.id,p_other_user_id)
 and (select count(*) from public.chat_participants x where x.conversation_id=c.id)=2 limit 1;
 if cid is null then
  insert into public.chat_conversations(type,created_by) values('direct',me) returning id into cid;
  insert into public.chat_participants(conversation_id,user_id) values(cid,me),(cid,p_other_user_id);
 end if;
 return cid;
end; $$;

drop policy if exists chat_conversations_select on public.chat_conversations;
drop policy if exists chat_conversations_insert on public.chat_conversations;
drop policy if exists chat_participants_select on public.chat_participants;
drop policy if exists chat_participants_insert on public.chat_participants;
drop policy if exists chat_messages_select on public.chat_messages;
drop policy if exists chat_messages_insert on public.chat_messages;
drop policy if exists chat_messages_update on public.chat_messages;
drop policy if exists chat_messages_delete on public.chat_messages;

create policy chat_conversations_select on public.chat_conversations for select to authenticated using(public.chat_is_participant(id,auth.uid()));
create policy chat_conversations_insert on public.chat_conversations for insert to authenticated with check(created_by=auth.uid());
create policy chat_participants_select on public.chat_participants for select to authenticated using(public.chat_is_participant(conversation_id,auth.uid()));
create policy chat_participants_insert on public.chat_participants for insert to authenticated with check(user_id=auth.uid() or exists(select 1 from public.chat_conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy chat_messages_select on public.chat_messages for select to authenticated using(public.chat_is_participant(conversation_id,auth.uid()));
create policy chat_messages_insert on public.chat_messages for insert to authenticated with check(sender_id=auth.uid() and public.chat_is_participant(conversation_id,auth.uid()));
create policy chat_messages_update on public.chat_messages for update to authenticated using(sender_id=auth.uid()) with check(sender_id=auth.uid());
create policy chat_messages_delete on public.chat_messages for delete to authenticated using(sender_id=auth.uid());

grant execute on function public.chat_is_participant(uuid,uuid) to authenticated;
grant execute on function public.chat_touch_presence() to authenticated;
grant execute on function public.chat_list_members() to authenticated;
grant execute on function public.chat_get_or_create_direct(uuid) to authenticated;
grant select,insert on public.chat_conversations to authenticated;
grant select,insert on public.chat_participants to authenticated;
grant select,insert,update,delete on public.chat_messages to authenticated;

do $$ begin alter publication supabase_realtime add table public.chat_messages; exception when duplicate_object then null; end $$;