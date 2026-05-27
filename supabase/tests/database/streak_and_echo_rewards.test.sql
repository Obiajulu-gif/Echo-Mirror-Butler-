begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(7);

delete from public.echo_rewards
where user_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
delete from public.mood_logs
where user_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
delete from public.user_wallets
where user_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
delete from auth.identities
where user_id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);
delete from auth.users
where id in (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_anonymous
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'streak-a@example.com',
    'test-password',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'streak-b@example.com',
    'test-password',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    false
  );

insert into public.user_wallets (user_id, public_key, encrypted_secret, balance)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'GTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'encrypted-a',
    0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'GTESTBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'encrypted-b',
    0
  );

select is(
  public.get_current_streak('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'get_current_streak returns 0 for a user with no logs'
);

insert into public.mood_logs (user_id, mood, created_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'happy', now());

select is(
  public.get_current_streak('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'get_current_streak returns 1 for a single log today'
);

truncate public.mood_logs, public.echo_rewards restart identity;
update public.user_wallets
set balance = 0
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.mood_logs (user_id, mood, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'happy', current_date::timestamptz),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'calm', (current_date - interval '1 day')::timestamptz),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hopeful', (current_date - interval '2 days')::timestamptz);

select is(
  public.get_current_streak('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  3,
  'get_current_streak returns N for consecutive days ending today'
);

truncate public.mood_logs, public.echo_rewards restart identity;
update public.user_wallets
set balance = 0
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.mood_logs (user_id, mood, created_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'happy', (current_date - interval '2 days')::timestamptz),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'calm', (current_date - interval '3 days')::timestamptz);

select is(
  public.get_current_streak('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'get_current_streak resets to 0 when the streak has a gap before today'
);

truncate public.mood_logs, public.echo_rewards restart identity;
update public.user_wallets
set balance = 0
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.mood_logs (user_id, mood, created_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'happy', now());

select is(
  (select balance::integer from public.user_wallets where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'inserting a mood log increments ECHO balance by the daily reward amount'
);

insert into public.mood_logs (user_id, mood, created_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'calm', now());

select is(
  (select balance::integer from public.user_wallets where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'duplicate logs on the same day do not double-credit ECHO'
);

delete from public.mood_logs
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select balance::integer from public.user_wallets where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'deleting a log does not subtract ECHO rewards'
);

select * from finish();

rollback;
