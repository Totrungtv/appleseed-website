-- Apple Seed Member Friends v1
create table if not exists public.member_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists member_friendships_pair_uq on public.member_friendships (least(requester_id,addressee_id), greatest(requester_id,addressee_id));
create index if not exists member_friendships_addressee_status_idx on public.member_friendships(addressee_id,status);
create index if not exists member_friendships_requester_status_idx on public.member_friendships(requester_id,status);
alter table public.member_friendships enable row level security;
drop policy if exists "member_friendships_no_direct_access" on public.member_friendships;
create policy "member_friendships_no_direct_access" on public.member_friendships for all to authenticated using (false) with check (false);

create or replace function public.chat_send_friend_request(p_other_user_id uuid)
returns text language plpgsql security definer set search_path=public as $function$
declare me uuid:=auth.uid(); existing_status text; existing_requester uuid;
begin
 if me is null or p_other_user_id is null or me=p_other_user_id then raise exception 'INVALID_FRIEND_REQUEST'; end if;
 if not exists(select 1 from public.member_accounts where user_id=me) or not exists(select 1 from public.member_accounts where user_id=p_other_user_id) then raise exception 'MEMBER_NOT_AVAILABLE'; end if;
 select status,requester_id into existing_status,existing_requester from public.member_friendships
 where least(requester_id,addressee_id)=least(me,p_other_user_id) and greatest(requester_id,addressee_id)=greatest(me,p_other_user_id) limit 1;
 if existing_status='accepted' then return 'accepted'; end if;
 if existing_status='pending' then
   if existing_requester=me then return 'pending_sent'; end if;
   update public.member_friendships set status='accepted',updated_at=now()
   where least(requester_id,addressee_id)=least(me,p_other_user_id) and greatest(requester_id,addressee_id)=greatest(me,p_other_user_id);
   return 'accepted';
 end if;
 insert into public.member_friendships(requester_id,addressee_id,status) values(me,p_other_user_id,'pending')
 on conflict (least(requester_id,addressee_id),greatest(requester_id,addressee_id))
 do update set requester_id=excluded.requester_id,addressee_id=excluded.addressee_id,status='pending',updated_at=now();
 return 'pending_sent';
end;$function$;

create or replace function public.chat_list_friendships()
returns table(user_id uuid,full_name text,online boolean,relation text,requested_by_me boolean)
language sql stable security definer set search_path=public as $function$
select p.id,p.full_name,coalesce(ma.last_seen_at>now()-interval '5 minutes',false),f.status,(f.requester_id=auth.uid())
from public.member_friendships f
join public.profiles p on p.id=case when f.requester_id=auth.uid() then f.addressee_id else f.requester_id end
join public.member_accounts ma on ma.user_id=p.id
where auth.uid() in(f.requester_id,f.addressee_id)
order by f.status,lower(coalesce(p.full_name,''));
$function$;

create or replace function public.chat_respond_friend_request(p_other_user_id uuid,p_accept boolean)
returns text language plpgsql security definer set search_path=public as $function$
declare me uuid:=auth.uid(); requester uuid;
begin
 if me is null or p_other_user_id is null or me=p_other_user_id then raise exception 'INVALID_FRIEND_REQUEST'; end if;
 select requester_id into requester from public.member_friendships
 where addressee_id=me and requester_id=p_other_user_id and status='pending' limit 1;
 if requester is null then raise exception 'FRIEND_REQUEST_NOT_FOUND'; end if;
 update public.member_friendships set status=case when p_accept then 'accepted' else 'rejected' end,updated_at=now()
 where addressee_id=me and requester_id=p_other_user_id and status='pending';
 return case when p_accept then 'accepted' else 'rejected' end;
end;$function$;

grant execute on function public.chat_send_friend_request(uuid) to authenticated;
grant execute on function public.chat_list_friendships() to authenticated;
grant execute on function public.chat_respond_friend_request(uuid,boolean) to authenticated;