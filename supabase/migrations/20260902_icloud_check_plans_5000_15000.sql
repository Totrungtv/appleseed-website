-- Apple Seed: iCloud Check plans 5,000đ / 15,000đ
-- STAGING migration. Apply only after review/test.

create or replace function public.create_icloud_check_payment_v2(
  p_identifier_type text,
  p_identifier text,
  p_device_model text default null,
  p_plan text default 'basic'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id uuid;
  v_ref text;
  v_amount integer;
begin
  if p_identifier_type not in ('imei','serial') then
    raise exception 'INVALID_IDENTIFIER_TYPE';
  end if;
  if trim(coalesce(p_identifier,'')) = '' then
    raise exception 'IDENTIFIER_REQUIRED';
  end if;

  if p_plan = 'pro' then
    v_amount := 15000;
  elsif p_plan = 'basic' then
    v_amount := 5000;
  else
    raise exception 'INVALID_CHECK_PLAN';
  end if;

  v_ref := 'AS-ICL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));

  insert into public.icloud_check_payments(
    user_id, amount_vnd, payment_ref, identifier_type, identifier, device_model
  ) values (
    null, v_amount, v_ref, p_identifier_type,
    upper(trim(p_identifier)), nullif(trim(p_device_model),'')
  ) returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'payment_ref', v_ref,
    'amount_vnd', v_amount,
    'plan', p_plan,
    'status', 'pending',
    'expires_at', (select expires_at from public.icloud_check_payments where id=v_id)
  );
end
$function$;

grant execute on function public.create_icloud_check_payment_v2(text,text,text,text) to anon, authenticated;
