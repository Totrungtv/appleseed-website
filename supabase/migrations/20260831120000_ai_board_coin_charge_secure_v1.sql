create or replace function public.apple_seed_reserve_ai_board_action(
  p_analysis_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  k text := lower(trim(coalesce(p_action,'')));
  v_cost bigint;
  v_label text;
  v_balance bigint;
  v_charge public.ai_coin_charges%rowtype;
begin
  if uid is null then
    return jsonb_build_object('ok',false,'code','NOT_AUTHENTICATED','message','Vui lòng đăng nhập.');
  end if;
  if p_analysis_id is null then
    return jsonb_build_object('ok',false,'code','MISSING_ANALYSIS_ID','message','Thiếu mã phân tích.');
  end if;
  if k not in ('ai_analysis','schematic_analysis') then
    return jsonb_build_object('ok',false,'code','INVALID_ACTION','message','Loại phân tích không hợp lệ.');
  end if;

  select cost,label into v_cost,v_label
  from public.ai_board_coin_settings
  where setting_key=k;

  if v_cost is null or v_cost <= 0 then
    return jsonb_build_object('ok',false,'code','INVALID_COST','message','Chưa cấu hình giá Coin cho chức năng này.');
  end if;

  select * into v_charge
  from public.ai_coin_charges
  where analysis_id=p_analysis_id
  for update;

  if found then
    if v_charge.user_id <> uid then
      return jsonb_build_object('ok',false,'code','ANALYSIS_OWNERSHIP_ERROR','message','Phân tích không thuộc tài khoản này.');
    end if;
    return jsonb_build_object('ok',true,'status',v_charge.status,'analysis_id',p_analysis_id,'cost',v_charge.cost,'message','Giao dịch đã tồn tại.');
  end if;

  select coins into v_balance
  from public.member_accounts
  where user_id=uid
    and status in ('trial','active')
    and (status <> 'trial' or trial_expires_at is null or trial_expires_at > now())
  for update;

  if v_balance is null then
    return jsonb_build_object('ok',false,'code','MEMBER_ACCOUNT_NOT_FOUND','message','Tài khoản thành viên chưa sẵn sàng.');
  end if;

  if v_balance < v_cost then
    return jsonb_build_object('ok',false,'code','INSUFFICIENT_COINS','message',format('Không đủ Coin. %s cần %s Coin, hiện có %s Coin.',v_label,v_cost,v_balance),'cost',v_cost,'balance',v_balance);
  end if;

  update public.member_accounts set coins=v_balance-v_cost, updated_at=now() where user_id=uid;
  insert into public.ai_coin_charges(analysis_id,user_id,cost,status) values(p_analysis_id,uid,v_cost,'reserved');
  insert into public.member_coin_ledger(user_id,delta,balance_after,transaction_type,note,created_by)
  values(uid,-v_cost,v_balance-v_cost,'usage',format('%s: -%s Coin [AI:%s]',v_label,v_cost,p_analysis_id),uid);

  return jsonb_build_object('ok',true,'status','reserved','analysis_id',p_analysis_id,'action',k,'cost',v_cost,'balance_after',v_balance-v_cost);
end;
$$;

create or replace function public.apple_seed_refund_ai_board_charge(p_analysis_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_charge public.ai_coin_charges%rowtype;
  v_balance bigint;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_charge from public.ai_coin_charges where analysis_id=p_analysis_id for update;
  if not found then raise exception 'CHARGE_NOT_FOUND'; end if;

  if v_charge.status='reserved' then
    update public.member_accounts set coins=coins+v_charge.cost,updated_at=now()
    where user_id=v_charge.user_id returning coins into v_balance;
    if v_balance is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;

    insert into public.member_coin_ledger(user_id,delta,balance_after,transaction_type,note,created_by)
    values(v_charge.user_id,v_charge.cost,v_balance,'adjustment',
      format('Hoàn Coin AI do lỗi phân tích: +%s Coin [AI_REFUND:%s]',v_charge.cost,p_analysis_id),
      v_charge.user_id);

    update public.ai_coin_charges set status='refunded',refunded_at=now() where id=v_charge.id;
  else
    v_balance := (select coins from public.member_accounts where user_id=v_charge.user_id);
  end if;

  return jsonb_build_object('ok',true,'status',(select status from public.ai_coin_charges where id=v_charge.id),
    'analysis_id',p_analysis_id,'balance',coalesce(v_balance,0));
end;
$$;