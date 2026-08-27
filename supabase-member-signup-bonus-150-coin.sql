-- Apple Seed: member signup bonus 150 Coin
-- Applied migration: member_signup_bonus_150_coin
-- New member_accounts rows receive 150 Coin once and a matching Ledger entry.
-- Existing accounts are intentionally untouched.

create or replace function public.apple_seed_create_member_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.member_accounts(
    user_id,
    coins,
    status,
    trial_started_at,
    trial_expires_at
  )
  values(
    new.id,
    150,
    'trial',
    coalesce(new.created_at, now()),
    coalesce(new.created_at, now()) + interval '3 days'
  )
  on conflict(user_id) do nothing;

  if found then
    insert into public.member_coin_ledger(
      user_id, delta, balance_after, transaction_type,
      payment_request_id, note, created_by
    )
    values(
      new.id, 150, 150, 'adjustment', null,
      'Thưởng 150 Coin khi đăng ký thành viên miễn phí', null
    );
  end if;

  return new;
end;
$function$;