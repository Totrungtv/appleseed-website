-- Apple Seed Member Chat v2
-- Fix empty member list: chat_list_members previously required profiles.role='member',
-- while current registered accounts use member_accounts + profiles roles admin/staff.

create or replace function public.chat_list_members()
returns table(
  id uuid,
  full_name text,
  role text,
  online boolean,
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    p.id,
    p.full_name,
    p.role,
    coalesce(ma.last_seen_at > now() - interval '5 minutes', false) as online,
    ma.last_seen_at
  from public.profiles p
  join public.member_accounts ma on ma.user_id = p.id
  where auth.uid() is not null
    and p.id <> auth.uid()
  order by
    coalesce(ma.last_seen_at > now() - interval '5 minutes', false) desc,
    lower(coalesce(p.full_name, '')),
    p.created_at;
$function$;

create or replace function public.chat_get_or_create_direct(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if me is null or p_other_user_id is null or me = p_other_user_id then
    raise exception 'INVALID_CHAT_USER';
  end if;

  if not exists (
    select 1 from public.member_accounts
    where user_id = p_other_user_id
  ) then
    raise exception 'USER_NOT_AVAILABLE';
  end if;

  if not exists (
    select 1 from public.member_accounts
    where user_id = me
  ) then
    raise exception 'CURRENT_USER_NOT_AVAILABLE';
  end if;

  select c.id into cid
  from public.chat_conversations c
  where c.type = 'direct'
    and public.chat_is_participant(c.id, me)
    and public.chat_is_participant(c.id, p_other_user_id)
    and (
      select count(*)
      from public.chat_participants x
      where x.conversation_id = c.id
    ) = 2
  limit 1;

  if cid is null then
    insert into public.chat_conversations(type, created_by)
    values ('direct', me)
    returning id into cid;

    insert into public.chat_participants(conversation_id, user_id)
    values (cid, me), (cid, p_other_user_id);
  end if;

  return cid;
end;
$function$;
