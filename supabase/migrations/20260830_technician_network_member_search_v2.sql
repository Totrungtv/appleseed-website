-- Apple Seed Technician Network: robust member search
-- Separate migration for phone/name search reliability.
create or replace function public.chat_search_members(p_query text default '')
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
set search_path to public, auth
as $function$
with q as (
  select
    lower(btrim(coalesce(p_query,''))) as text_q,
    regexp_replace(btrim(coalesce(p_query,'')),'[^0-9]','','g') as phone_q
)
select
  p.id,
  coalesce(nullif(p.full_name,''), nullif(ma.user_id::text,''), 'Thành viên') as full_name,
  coalesce(nullif(p.role,''),'member') as role,
  coalesce(ma.last_seen_at > now() - interval '5 minutes', false) as online,
  ma.last_seen_at
from public.member_accounts ma
left join public.profiles p on p.id=ma.user_id
cross join q
left join auth.users u on u.id=ma.user_id
where ma.user_id <> auth.uid()
  and (
    q.text_q = ''
    or lower(coalesce(p.full_name,'')) like '%' || q.text_q || '%'
    or lower(coalesce(u.email,'')) like '%' || q.text_q || '%'
    or (
      length(q.phone_q) >= 3
      and (
        regexp_replace(coalesce(nullif(u.raw_user_meta_data->>'phone',''),nullif(u.raw_user_meta_data->>'phone_number',''),nullif(u.phone,'')),'[^0-9]','','g')
        like '%' || q.phone_q || '%'
      )
    )
  )
order by
  coalesce(ma.last_seen_at > now() - interval '5 minutes', false) desc,
  lower(coalesce(p.full_name,u.email,'')),
  ma.created_at desc
limit 100;
$function$;

grant execute on function public.chat_search_members(text) to authenticated;