-- Apple Seed Member Chat: search by registration phone without exposing phone values
create or replace function public.chat_search_members(p_query text default '')
returns table(id uuid,full_name text,role text,online boolean,last_seen_at timestamptz)
language sql security definer stable set search_path=public,auth as $$
with q as (select lower(btrim(coalesce(p_query,''))) as text_q,regexp_replace(coalesce(p_query,''),'[^0-9]','','g') as phone_q)
select p.id,p.full_name,p.role,coalesce(ma.last_seen_at>now()-interval '5 minutes',false),ma.last_seen_at
from public.profiles p left join public.member_accounts ma on ma.user_id=p.id cross join q left join auth.users u on u.id=p.id
where auth.uid() is not null and p.role='member' and (q.text_q='' or lower(coalesce(p.full_name,'')) like '%'||q.text_q||'%' or (length(q.phone_q)>=3 and regexp_replace(coalesce(u.raw_user_meta_data->>'phone',u.phone,''),'[^0-9]','','g') like '%'||q.phone_q||'%'))
order by coalesce(ma.last_seen_at>now()-interval '5 minutes',false) desc,lower(coalesce(p.full_name,'')),p.created_at limit 50;
$$;
grant execute on function public.chat_search_members(text) to authenticated;