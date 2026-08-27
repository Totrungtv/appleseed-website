-- Apple Seed Member Management V1 FIX 01
-- Compute Trial/Expired/Active status from expiry + coin balance so a 3-day trial
-- cannot remain logically active just because the stored status is still 'trial'.

create or replace function public.apple_seed_admin_member_list(p_search text default null,p_limit integer default 100,p_offset integer default 0)
returns table(user_id uuid,email text,email_confirmed_at timestamptz,created_at timestamptz,last_sign_in_at timestamptz,full_name text,phone text,account_status text,coins bigint,trial_started_at timestamptz,trial_expires_at timestamptz,last_seen_at timestamptz,pending_payments bigint)
language plpgsql security definer set search_path=public,auth as $$
begin
 if not public.apple_seed_is_admin() then raise exception 'Admin only'; end if;
 return query
 select u.id,u.email::text,u.email_confirmed_at,u.created_at,u.last_sign_in_at,
 coalesce(cm.full_name,u.raw_user_meta_data->>'full_name')::text,
 coalesce(cm.phone,u.raw_user_meta_data->>'phone')::text,
 case
   when coalesce(ma.status,'trial')='suspended' then 'suspended'
   when coalesce(ma.coins,0)>0 then 'active'
   when coalesce(ma.trial_expires_at,u.created_at+interval '3 days')>now() then 'trial'
   else 'expired'
 end::text,
 coalesce(ma.coins,0)::bigint,coalesce(ma.trial_started_at,u.created_at),
 coalesce(ma.trial_expires_at,u.created_at+interval '3 days'),ma.last_seen_at,
 (select count(*) from public.member_payment_requests pr where pr.user_id=u.id and pr.status='pending')::bigint
 from auth.users u
 left join public.customer_members cm on cm.user_id=u.id
 left join public.member_accounts ma on ma.user_id=u.id
 where(nullif(trim(coalesce(p_search,'')),'') is null or lower(coalesce(u.email,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(cm.full_name,u.raw_user_meta_data->>'full_name','')) like '%'||lower(trim(p_search))||'%' or coalesce(cm.phone,u.raw_user_meta_data->>'phone','') like '%'||trim(p_search)||'%')
 order by u.created_at desc limit greatest(1,least(coalesce(p_limit,100),500)) offset greatest(coalesce(p_offset,0),0);
end; $$;

create or replace function public.apple_seed_admin_member_detail(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare result jsonb;
begin
 if not public.apple_seed_is_admin() then raise exception 'Admin only'; end if;
 select jsonb_build_object(
 'account',jsonb_build_object(
   'user_id',u.id,'email',u.email,'email_confirmed_at',u.email_confirmed_at,
   'created_at',u.created_at,'last_sign_in_at',u.last_sign_in_at,'phone_auth',u.phone,
   'full_name',coalesce(cm.full_name,u.raw_user_meta_data->>'full_name'),
   'phone',coalesce(cm.phone,u.raw_user_meta_data->>'phone'),
   'status',case
      when coalesce(ma.status,'trial')='suspended' then 'suspended'
      when coalesce(ma.coins,0)>0 then 'active'
      when coalesce(ma.trial_expires_at,u.created_at+interval '3 days')>now() then 'trial'
      else 'expired'
    end,
   'coins',coalesce(ma.coins,0),
   'trial_started_at',coalesce(ma.trial_started_at,u.created_at),
   'trial_expires_at',coalesce(ma.trial_expires_at,u.created_at+interval '3 days'),
   'last_seen_at',ma.last_seen_at),
 'payments',coalesce((select jsonb_agg(to_jsonb(pr) order by pr.submitted_at desc) from public.member_payment_requests pr where pr.user_id=u.id),'[]'::jsonb),
 'ledger',coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from public.member_coin_ledger l where l.user_id=u.id),'[]'::jsonb)) into result
 from auth.users u
 left join public.customer_members cm on cm.user_id=u.id
 left join public.member_accounts ma on ma.user_id=u.id
 where u.id=p_user_id;
 if result is null then raise exception 'Member not found'; end if;
 return result;
end; $$;