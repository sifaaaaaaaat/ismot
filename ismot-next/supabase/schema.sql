-- Ismot Hair Oil — orders table for Supabase.
--
-- Run this in the Supabase SQL editor once per project. The app writes with the
-- service-role key from the server only, so RLS stays on with NO policies:
-- anon and authenticated keys cannot read, insert or update orders.

create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_ref     text not null unique,
  customer_name text not null,
  phone         text not null,
  address       text not null,
  product       text not null,
  size          text not null,
  quantity      integer not null check (quantity between 1 and 10),
  status        text not null default 'Pending'
                check (status in ('Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled')),
  submission_id text not null unique,
  created_at    timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);

alter table public.orders enable row level security;

-- Intentionally no policies: only the service role (server-side) can touch this
-- table. Do not add a public select policy — it would expose customer data.
