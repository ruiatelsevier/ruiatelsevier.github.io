create table if not exists public.post_likes (
  post_slug text primary key,
  like_count integer not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;

create or replace function public.increment_post_like(slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if slug is null or length(trim(slug)) = 0 then
    raise exception 'slug is required';
  end if;

  insert into public.post_likes (post_slug, like_count, updated_at)
  values (slug, 1, now())
  on conflict (post_slug)
  do update set
    like_count = public.post_likes.like_count + 1,
    updated_at = now()
  returning like_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_post_like(text) from public;
grant execute on function public.increment_post_like(text) to anon;

drop policy if exists "Public can read post likes" on public.post_likes;
create policy "Public can read post likes"
on public.post_likes
for select
to anon
using (true);

revoke insert, update, delete on public.post_likes from anon;
grant select on public.post_likes to anon;

create table if not exists public.post_views (
  post_slug text primary key,
  view_count integer not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.post_views enable row level security;

create or replace function public.increment_post_view(slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if slug is null or length(trim(slug)) = 0 then
    raise exception 'slug is required';
  end if;

  insert into public.post_views (post_slug, view_count, updated_at)
  values (slug, 1, now())
  on conflict (post_slug)
  do update set
    view_count = public.post_views.view_count + 1,
    updated_at = now()
  returning view_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_post_view(text) from public;
grant execute on function public.increment_post_view(text) to anon;

drop policy if exists "Public can read post views" on public.post_views;
create policy "Public can read post views"
on public.post_views
for select
to anon
using (true);

revoke insert, update, delete on public.post_views from anon;
grant select on public.post_views to anon;
