-- Apple Seed AI Board Coin enforcement v2
-- Refunds a reserved AI charge when the provider/analysis fails.
-- Usage is enforced server-side by the appleseed-ai Edge Function.

create or replace function public.apple_seed_refund_ai_board_coins(
  p_action text,
  p_reference text default null
)
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
  ref text := nullif(trim(coalesce(p_reference,'')),'');
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

  if ref is not null and exists (
    select 1
    from public.member_coin_ledger
    where user_id = uid
      and transaction_type = 'adjustment'
      and note like '%[AI_REFUND:' || ref || ']%'
  ) then
    select coins into new_balance
    from public.member_accounts
    where user_id = uid;
    return jsonb_build_object('ok',true,'already_refunded',true,'balance',coalesce(new_balance,0));
  end if;

  update public.member_accounts
     set coins = coins + cost,
         updated_at = now()
   where user_id = uid
   returning coins into new_balance;

  if new_balance is null then
    return jsonb_build_object('ok',false,'code','ACCOUNT_NOT_FOUND','message','Chưa có tài khoản Coin.');
  end if;

  insert into public.member_coin_ledger
    (user_id,delta,balance_after,transaction_type,note,created_by)
  values
    (uid,cost,new_balance,'adjustment',
     format('%s: hoàn %s Coin%s',action_label,cost,
       case when ref is null then '' else ' [AI_REFUND:'||ref||']' end),
     uid);

  return jsonb_build_object('ok',true,'refunded',cost,'balance',new_balance);
end;
$$;

revoke all on function public.apple_seed_refund_ai_board_coins(text,text) from public, anon, authenticated;
grant execute on function public.apple_seed_refund_ai_board_coins(text,text) to authenticated;
