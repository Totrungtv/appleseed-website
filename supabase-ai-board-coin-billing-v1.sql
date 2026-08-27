-- Apple Seed AI Board Coin billing v1
-- Pricing: AI diagnosis = 20 Coin / successful analysis; Schematic Intelligence = 10 Coin / successful analysis.
-- Applied to Supabase project nuismqcjyutqigdydfkg.

create or replace function public.apple_seed_member_account_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ma public.member_accounts%rowtype;
  cm public.customer_members%rowtype;
begin
  if uid is null then
    return jsonb_build_object('ok',false,'message','Vui lòng đăng nhập.');
  end if;

  select * into ma from public.member_accounts where user_id = uid limit 1;
  select * into cm from public.customer_members where user_id = uid limit 1;

  if ma.user_id is null then
    return jsonb_build_object('ok',false,'message','Chưa có tài khoản thành viên.');
  end if;

  return jsonb_build_object(
    'ok',true,
    'account',jsonb_build_object(
      'user_id',uid,
      'email',coalesce(cm.email,''),
      'full_name',coalesce(cm.full_name,''),
      'phone',coalesce(cm.phone,''),
      'coins',ma.coins,
      'status',ma.status,
      'trial_started_at',ma.trial_started_at,
      'trial_expires_at',ma.trial_expires_at
    )
  );
end;
$$;

create or replace function public.apple_seed_consume_ai_board_coins(p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cost bigint;
  action_label text;
  new_balance bigint;
begin
  if uid is null then
    return jsonb_build_object('ok',false,'code','NOT_AUTHENTICATED','message','Vui lòng đăng nhập.');
  end if;

  case lower(trim(coalesce(p_action,'')))
    when 'ai_analysis' then
      cost := 20;
      action_label := 'AI Board Diagnosis';
    when 'schematic_analysis' then
      cost := 10;
      action_label := 'Schematic Intelligence';
    else
      return jsonb_build_object('ok',false,'code','INVALID_ACTION','message','Loại phân tích không hợp lệ.');
  end case;

  update public.member_accounts
     set coins = coins - cost,
         updated_at = now()
   where user_id = uid
     and coins >= cost
   returning coins into new_balance;

  if new_balance is null then
    return jsonb_build_object(
      'ok',false,
      'code','INSUFFICIENT_COINS',
      'message',format('Không đủ Coin. %s cần %s Coin.',action_label,cost)
    );
  end if;

  insert into public.member_coin_ledger
    (user_id,delta,balance_after,transaction_type,note,created_by)
  values
    (uid,-cost,new_balance,'ai_board_usage',
     format('%s: -%s Coin',action_label,cost),uid);

  return jsonb_build_object(
    'ok',true,
    'action',lower(trim(p_action)),
    'cost',cost,
    'balance',new_balance
  );
end;
$$;

revoke all on function public.apple_seed_member_account_summary() from public;
grant execute on function public.apple_seed_member_account_summary() to authenticated;

revoke all on function public.apple_seed_consume_ai_board_coins(text) from public;
grant execute on function public.apple_seed_consume_ai_board_coins(text) to authenticated;
