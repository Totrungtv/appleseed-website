-- Apple Seed iCloud public payment flow v1
-- The iCloud checker is intentionally public: no Member login and no AI Coin.
-- Payment of exactly 5,000 VND is the gate before the provider is called.

alter table public.icloud_check_payments
  alter column user_id drop not null;

create or replace function public.create_icloud_check_payment(
  p_identifier_type text,
  p_identifier text,
  p_device_model text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_ref text;
begin
  if p_identifier_type not in ('imei','serial') then
    raise exception 'INVALID_IDENTIFIER_TYPE';
  end if;
  if trim(coalesce(p_identifier,'')) = '' then
    raise exception 'IDENTIFIER_REQUIRED';
  end if;

  v_ref := 'AS-ICL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));

  insert into public.icloud_check_payments(
    user_id, amount_vnd, payment_ref, identifier_type, identifier, device_model
  )
  values(
    v_user, 5000, v_ref, p_identifier_type,
    upper(trim(p_identifier)), nullif(trim(p_device_model),'')
  )
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'payment_ref', v_ref,
    'amount_vnd', 5000,
    'status', 'pending',
    'expires_at', (select expires_at from public.icloud_check_payments where id=v_id)
  );
end
$function$;

create or replace function public.get_icloud_check_payment_status(p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_payment public.icloud_check_payments%rowtype;
begin
  select * into v_payment from public.icloud_check_payments where id = p_payment_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'PAYMENT_NOT_FOUND');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_payment.id,
    'status', v_payment.status,
    'expires_at', v_payment.expires_at,
    'paid_at', v_payment.paid_at,
    'completed_at', v_payment.completed_at
  );
end
$function$;

revoke all on function public.get_icloud_check_payment_status(uuid) from public;
grant execute on function public.get_icloud_check_payment_status(uuid) to anon, authenticated;

revoke all on function public.create_icloud_check_payment(text,text,text) from public;
grant execute on function public.create_icloud_check_payment(text,text,text) to anon, authenticated;
