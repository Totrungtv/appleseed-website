create or replace function public.chat_list_conversations()
returns table(id uuid,type text,name text,updated_at timestamptz)
language sql stable security definer set search_path=public
as $$ select c.id,c.type,c.name,c.updated_at from public.chat_conversations c join public.chat_participants cp on cp.conversation_id=c.id where cp.user_id=auth.uid() order by c.updated_at desc nulls last,c.created_at desc; $$;

create or replace function public.chat_start_direct(p_other_user_id uuid,p_other_name text default null)
returns uuid language plpgsql security definer set search_path=public
as $$ declare me uuid:=auth.uid(); cid uuid;
begin
 if me is null or p_other_user_id is null or me=p_other_user_id then raise exception 'INVALID_CHAT_USER'; end if;
 if not exists(select 1 from public.member_accounts where user_id=me) or not exists(select 1 from public.member_accounts where user_id=p_other_user_id) then raise exception 'MEMBER_NOT_AVAILABLE'; end if;
 select c.id into cid from public.chat_conversations c where c.type='direct' and exists(select 1 from public.chat_participants a where a.conversation_id=c.id and a.user_id=me) and exists(select 1 from public.chat_participants b where b.conversation_id=c.id and b.user_id=p_other_user_id) order by c.updated_at desc limit 1;
 if cid is null then insert into public.chat_conversations(type,name,created_by) values('direct',coalesce(nullif(trim(p_other_name),''),'Cuộc trò chuyện'),me) returning id into cid; insert into public.chat_participants(conversation_id,user_id) values(cid,me),(cid,p_other_user_id); end if;
 return cid;
end; $$;

create or replace function public.chat_create_group(p_name text,p_member_ids uuid[] default '{}')
returns uuid language plpgsql security definer set search_path=public
as $$ declare me uuid:=auth.uid(); cid uuid; uid uuid;
begin
 if me is null then raise exception 'AUTH_REQUIRED'; end if;
 if nullif(trim(p_name),'') is null then raise exception 'GROUP_NAME_REQUIRED'; end if;
 insert into public.chat_conversations(type,name,created_by) values('group',trim(p_name),me) returning id into cid;
 insert into public.chat_participants(conversation_id,user_id) values(cid,me);
 foreach uid in array coalesce(p_member_ids,'{}'::uuid[]) loop
  if uid is not null and uid<>me and exists(select 1 from public.member_accounts where user_id=uid) then insert into public.chat_participants(conversation_id,user_id) values(cid,uid) on conflict do nothing; end if;
 end loop;
 return cid;
end; $$;

create or replace function public.chat_get_participants(p_conversation_id uuid)
returns table(user_id uuid,full_name text,online boolean)
language sql stable security definer set search_path=public
as $$ select p.id,p.full_name,coalesce(ma.last_seen_at>now()-interval '5 minutes',false) from public.chat_participants cp join public.profiles p on p.id=cp.user_id left join public.member_accounts ma on ma.user_id=p.id where cp.conversation_id=p_conversation_id and exists(select 1 from public.chat_participants me where me.conversation_id=p_conversation_id and me.user_id=auth.uid()) order by lower(coalesce(p.full_name,'')); $$;

create or replace function public.chat_get_messages(p_conversation_id uuid,p_limit integer default 300)
returns table(id uuid,conversation_id uuid,sender_id uuid,body text,created_at timestamptz)
language sql stable security definer set search_path=public
as $$ select m.id,m.conversation_id,m.sender_id,m.body,m.created_at from public.chat_messages m where m.conversation_id=p_conversation_id and exists(select 1 from public.chat_participants cp where cp.conversation_id=p_conversation_id and cp.user_id=auth.uid()) order by m.created_at asc limit least(greatest(coalesce(p_limit,300),1),500); $$;

create or replace function public.chat_send_message(p_conversation_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public
as $$ declare me uuid:=auth.uid(); mid uuid;
begin
 if me is null then raise exception 'AUTH_REQUIRED'; end if;
 if nullif(trim(p_body),'') is null then raise exception 'EMPTY_MESSAGE'; end if;
 if not exists(select 1 from public.chat_participants where conversation_id=p_conversation_id and user_id=me) then raise exception 'NOT_CONVERSATION_MEMBER'; end if;
 insert into public.chat_messages(conversation_id,sender_id,body) values(p_conversation_id,me,trim(p_body)) returning id into mid;
 update public.chat_conversations set updated_at=now() where id=p_conversation_id;
 return mid;
end; $$;

grant execute on function public.chat_list_conversations() to authenticated;
grant execute on function public.chat_start_direct(uuid,text) to authenticated;
grant execute on function public.chat_create_group(text,uuid[]) to authenticated;
grant execute on function public.chat_get_participants(uuid) to authenticated;
grant execute on function public.chat_get_messages(uuid,integer) to authenticated;
grant execute on function public.chat_send_message(uuid,text) to authenticated;