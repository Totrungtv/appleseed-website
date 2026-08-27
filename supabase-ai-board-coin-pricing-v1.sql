-- Apple Seed AI Board Coin pricing control v1
-- Separate migration: admin can change AI usage cost without editing Edge Function code.
create table if not exists public.ai_board_coin_settings (
  setting_key text primary key,
  cost bigint not null check (cost >= 0),
  label text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.ai_board_coin_settings(setting_key,cost,label)
values
  ('ai_analysis',20,'AI Board Diagnosis'),
  ('schematic_analysis',10,'Schematic Intelligence')
on conflict (setting_key) do nothing;

alter table public.ai_board_coin_settings enable row level security;
revoke all on public.ai_board_coin_settings from anon, authenticated;

create or replace function public.apple_seed_ai_board_coin_prices()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.apple_seed_is_admin() then
    raise exception 'Admin only';
  end if;
  return coalesce(
    (select jsonb_object_agg(setting_key,jsonb_build_object('cost',cost,'label',label))
     from public.ai_board_coin_settings),
    '{}'::jsonb
  );
end;
$$;

create or replace function public.apple_seed_admin_set_ai_board_coin_price(
  p_action text,
  p_cost bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := lower(trim(coalesce(p_action,'')));
  new_cost bigint := coalesce(p_cost,0);
  lbl text;
begin
  if not public.apple_seed_is_admin() then raise exception 'Admin only'; end if;
  if k not in ('ai_analysis','schematic_analysis') then raise exception 'Invalid AI action'; end if;
  if new_cost < 0 then raise exception 'Coin cost cannot be negative'; end if;

  select label into lbl from public.ai_board_coin_settings where setting_key=k;
  if lbl is null then
    lbl := case when k='ai_analysis' then 'AI Board Diagnosis' else 'Schematic Intelligence' end;
  end if;

  insert into public.ai_board_coin_settings(setting_key,cost,label,updated_at,updated_by)
  values(k,new_cost,lbl,now(),auth.uid())
  on conflict(setting_key) do update
    set cost=excluded.cost, updated_at=now(), updated_by=auth.uid();

  return jsonb_build_object('ok',true,'action',k,'cost',new_cost,'label',lbl);
end;
$$;

revoke all on function public.apple_seed_ai_board_coin_prices() from public, anon, authenticated;
grant execute on function public.apple_seed_ai_board_coin_prices() to authenticated;

revoke all on function public.apple_seed_admin_set_ai_board_coin_price(text,bigint) from public, anon, authenticated;
grant execute on function public.apple_seed_admin_set_ai_board_coin_price(text,bigint) to authenticated;

create or replace function public.apple_seed_consume_ai_board_coins(p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  k text := lower(trim(coalesce(p_action,'')));
  cost bigint;
  action_label text;
  new_balance bigint;
begin
  if uid is null then
    return jsonb_build_object('ok',false,'code','NOT_AUTHENTICATED','message','Vui lòng đăng nhập.');
  end if;

  select s.cost,s.label into cost,action_label
  from public.ai_board_coin_settings s
  where s.setting_key=k;

  if cost is null then
    return jsonb_build_object('ok',false,'code','INVALID_ACTION','message','Loại phân tích không hợp lệ.');
  end if;

  if cost = 0 then
    select coins into new_balance from public.member_accounts where user_id=uid;
    if new_balance is null then
      return jsonb_build_object('ok',false,'code','ACCOUNT_NOT_FOUND','message','Chưa có tài khoản thành viên.');
    end if;
    return jsonb_build_object('ok',true,'action',k,'cost',0,'balance',new_balance);
  end if;

  update public.member_accounts
     set coins = coins - cost, updated_at = now()
   where user_id=uid
     and status in ('trial','active')
     and (status <> 'trial' or trial_expires_at is null or trial_expires_at > now())
     and coins >= cost
   returning coins into new_balance;

  if new_balance is null then
    return jsonb_build_object(
      'ok',false,'code','INSUFFICIENT_COINS',
      'message',format('Không đủ Coin hoặc tài khoản không còn quyền sử dụng. %s cần %s Coin.',action_label,cost),
      'cost',cost
    );
  end if;

  insert into public.member_coin_ledger(user_id,delta,balance_after,transaction_type,note,created_by)
  values(uid,-cost,new_balance,'usage',format('%s: -%s Coin',action_label,cost),uid);

  return jsonb_build_object('ok',true,'action',k,'cost',cost,'balance',new_balance);
end;
$$;
