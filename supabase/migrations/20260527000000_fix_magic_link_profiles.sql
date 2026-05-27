-- Ensure every Supabase Auth user has a profile row with dashboard defaults.
alter table public.profiles
  add column if not exists echo_balance integer not null default 0,
  add column if not exists streak integer not null default 0;

update public.profiles
set
  echo_balance = coalesce(echo_balance, 0),
  streak = coalesce(streak, 0);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, echo_balance, streak)
  values (new.id, 0, 0)
  on conflict (id) do update
    set
      echo_balance = coalesce(public.profiles.echo_balance, 0),
      streak = coalesce(public.profiles.streak, 0);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
