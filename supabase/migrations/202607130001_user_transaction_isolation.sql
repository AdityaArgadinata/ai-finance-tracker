begin;

-- Every transaction belongs to one Supabase Auth user.
alter table public.transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

update public.transactions
set user_id = '403380e8-11a4-458d-9dbc-5a7a5b106943'
where user_id is null;

alter table public.transactions
  alter column user_id set not null;

create index if not exists transactions_user_id_idx
  on public.transactions(user_id);

-- One Telegram account can be linked to one web account.
create table if not exists public.telegram_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint unique not null,
  linked_at timestamptz not null default now()
);

-- Short-lived codes generated from the Account page.
create table if not exists public.telegram_link_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.telegram_accounts enable row level security;
alter table public.telegram_link_codes enable row level security;

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can create own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

create policy "Users can read own transactions"
on public.transactions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own transactions"
on public.transactions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own transactions"
on public.transactions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own transactions"
on public.transactions for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own Telegram link" on public.telegram_accounts;
drop policy if exists "Users can disconnect own Telegram link" on public.telegram_accounts;

create policy "Users can read own Telegram link"
on public.telegram_accounts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can disconnect own Telegram link"
on public.telegram_accounts for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own Telegram code" on public.telegram_link_codes;
drop policy if exists "Users can create own Telegram code" on public.telegram_link_codes;
drop policy if exists "Users can update own Telegram code" on public.telegram_link_codes;
drop policy if exists "Users can delete own Telegram code" on public.telegram_link_codes;

create policy "Users can read own Telegram code"
on public.telegram_link_codes for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own Telegram code"
on public.telegram_link_codes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own Telegram code"
on public.telegram_link_codes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own Telegram code"
on public.telegram_link_codes for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
