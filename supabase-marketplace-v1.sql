-- APPLE SEED MARKETPLACE V1
-- Chợ mua bán kỹ thuật: gian hàng + sản phẩm.
-- Migration riêng, không sửa/xóa bảng shop hiện tại.

create table if not exists public.marketplace_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  phone text,
  address text,
  status text not null default 'pending'
    check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.marketplace_shops(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  category text not null,
  condition text not null default 'new'
    check (condition in ('new','used','refurbished')),
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  gallery jsonb not null default '[]'::jsonb,
  brand text,
  model text,
  warranty text,
  status text not null default 'draft'
    check (status in ('draft','active','out_of_stock','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_products_shop_owner_fk
    foreign key (shop_id, seller_id)
    references public.marketplace_shops(id, owner_id)
    on delete cascade
);

create index if not exists idx_marketplace_products_category on public.marketplace_products(category);
create index if not exists idx_marketplace_products_status on public.marketplace_products(status);
create index if not exists idx_marketplace_products_shop on public.marketplace_products(shop_id);
create index if not exists idx_marketplace_products_created on public.marketplace_products(created_at desc);

alter table public.marketplace_shops enable row level security;
alter table public.marketplace_products enable row level security;

drop policy if exists "marketplace shops public active read" on public.marketplace_shops;
create policy "marketplace shops public active read"
on public.marketplace_shops for select to anon, authenticated
using (status = 'active' or owner_id = auth.uid());

drop policy if exists "marketplace shops owner insert" on public.marketplace_shops;
create policy "marketplace shops owner insert"
on public.marketplace_shops for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "marketplace shops owner update" on public.marketplace_shops;
create policy "marketplace shops owner update"
on public.marketplace_shops for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "marketplace shops owner delete" on public.marketplace_shops;
create policy "marketplace shops owner delete"
on public.marketplace_shops for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists "marketplace products public active read" on public.marketplace_products;
create policy "marketplace products public active read"
on public.marketplace_products for select to anon, authenticated
using (status = 'active' or seller_id = auth.uid());

drop policy if exists "marketplace products seller insert" on public.marketplace_products;
create policy "marketplace products seller insert"
on public.marketplace_products for insert to authenticated
with check (
  seller_id = auth.uid()
  and exists (
    select 1 from public.marketplace_shops s
    where s.id = shop_id and s.owner_id = auth.uid()
  )
);

drop policy if exists "marketplace products seller update" on public.marketplace_products;
create policy "marketplace products seller update"
on public.marketplace_products for update to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

drop policy if exists "marketplace products seller delete" on public.marketplace_products;
create policy "marketplace products seller delete"
on public.marketplace_products for delete to authenticated
using (seller_id = auth.uid());

create or replace function public.marketplace_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_shops_updated_at on public.marketplace_shops;
create trigger trg_marketplace_shops_updated_at
before update on public.marketplace_shops
for each row execute function public.marketplace_set_updated_at();

drop trigger if exists trg_marketplace_products_updated_at on public.marketplace_products;
create trigger trg_marketplace_products_updated_at
before update on public.marketplace_products
for each row execute function public.marketplace_set_updated_at();
