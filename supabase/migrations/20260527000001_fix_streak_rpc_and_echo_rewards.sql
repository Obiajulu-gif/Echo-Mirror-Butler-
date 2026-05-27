-- Compatibility fixes for streak and ECHO reward test coverage.
alter table public.user_wallets
  add column if not exists encrypted_secret text,
  add column if not exists balance integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists user_wallets_user_id_unique_idx
  on public.user_wallets(user_id);

create or replace function public.get_current_streak(user_id uuid)
returns integer
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_streak json;
begin
  v_streak := public.calculate_streak($1);
  return coalesce((v_streak->>'current_streak')::integer, 0);
end;
$$;
