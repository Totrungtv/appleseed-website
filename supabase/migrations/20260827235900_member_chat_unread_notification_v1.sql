-- Apple Seed Member Chat unread notification v1
-- Securely marks only the current user's participant row as read.
create or replace function public.chat_mark_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path=public
as $$
  update public.chat_participants
  set last_read_at=now()
  where conversation_id=p_conversation_id
    and user_id=auth.uid();
$$;

revoke all on function public.chat_mark_read(uuid) from public;
grant execute on function public.chat_mark_read(uuid) to authenticated;
