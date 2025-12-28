-- Family Recipes Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Families table
create table public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  invite_code text unique not null default substring(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- Family members (can include non-users like deceased relatives)
create table public.family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  photo_url text,
  birth_year integer,
  is_deceased boolean not null default false,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Family member relationships (for family tree)
create table public.family_member_relationships (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  parent_id uuid not null references public.family_members(id) on delete cascade,
  child_id uuid not null references public.family_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(parent_id, child_id)
);

-- Recipes
create table public.recipes (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text,
  origin_story text,
  origin_year integer,
  origin_location text,
  prep_time integer, -- in minutes
  cook_time integer, -- in minutes
  servings integer,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  hero_image_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recipe attributions (who created/taught the recipe)
create table public.recipe_attributions (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  attribution_type text not null check (attribution_type in ('created_by', 'learned_from')),
  year_learned integer,
  created_at timestamptz not null default now()
);

-- Ingredients
create table public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  text text not null,
  order_index integer not null default 0
);

-- Recipe steps
create table public.steps (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  instruction text not null,
  order_index integer not null default 0,
  image_url text,
  video_url text
);

-- Comments (family memories on recipes)
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- User profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_family_members_family_id on public.family_members(family_id);
create index idx_family_members_user_id on public.family_members(user_id);
create index idx_family_member_relationships_family_id on public.family_member_relationships(family_id);
create index idx_recipes_family_id on public.recipes(family_id);
create index idx_recipes_created_at on public.recipes(created_at desc);
create index idx_recipe_attributions_recipe_id on public.recipe_attributions(recipe_id);
create index idx_ingredients_recipe_id on public.ingredients(recipe_id);
create index idx_steps_recipe_id on public.steps(recipe_id);
create index idx_comments_recipe_id on public.comments(recipe_id);
create index idx_families_invite_code on public.families(invite_code);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute function public.handle_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to check if user is member of a family
create or replace function public.is_family_member(family_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.family_members
    where family_id = family_uuid
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_member_relationships enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_attributions enable row level security;
alter table public.ingredients enable row level security;
alter table public.steps enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;

-- Families policies
create policy "Users can view families they belong to"
  on public.families for select
  using (public.is_family_member(id));

create policy "Authenticated users can create families"
  on public.families for insert
  with check (auth.uid() is not null);

create policy "Family members can update their family"
  on public.families for update
  using (public.is_family_member(id));

-- Anyone can view a family by invite code (for joining)
create policy "Anyone can view family by invite code"
  on public.families for select
  using (true);

-- Family members policies
create policy "Users can view members of their families"
  on public.family_members for select
  using (public.is_family_member(family_id));

create policy "Family members can add new members"
  on public.family_members for insert
  with check (public.is_family_member(family_id) or
    -- Allow first member when creating family
    (auth.uid() is not null and not exists (
      select 1 from public.family_members where family_id = family_members.family_id
    )));

create policy "Family members can update members"
  on public.family_members for update
  using (public.is_family_member(family_id));

create policy "Family members can delete members"
  on public.family_members for delete
  using (public.is_family_member(family_id));

-- Family member relationships policies
create policy "Users can view relationships in their families"
  on public.family_member_relationships for select
  using (public.is_family_member(family_id));

create policy "Family members can manage relationships"
  on public.family_member_relationships for all
  using (public.is_family_member(family_id));

-- Recipes policies
create policy "Users can view recipes from their families"
  on public.recipes for select
  using (public.is_family_member(family_id));

create policy "Family members can create recipes"
  on public.recipes for insert
  with check (public.is_family_member(family_id));

create policy "Family members can update recipes"
  on public.recipes for update
  using (public.is_family_member(family_id));

create policy "Family members can delete recipes"
  on public.recipes for delete
  using (public.is_family_member(family_id));

-- Recipe attributions policies
create policy "Users can view attributions from their families"
  on public.recipe_attributions for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

create policy "Family members can manage attributions"
  on public.recipe_attributions for all
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

-- Ingredients policies
create policy "Users can view ingredients from their families"
  on public.ingredients for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

create policy "Family members can manage ingredients"
  on public.ingredients for all
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

-- Steps policies
create policy "Users can view steps from their families"
  on public.steps for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

create policy "Family members can manage steps"
  on public.steps for all
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

-- Comments policies
create policy "Users can view comments from their families"
  on public.comments for select
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ));

create policy "Family members can create comments"
  on public.comments for insert
  with check (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and public.is_family_member(r.family_id)
  ) and auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for recipe images
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict do nothing;

-- Storage policies for recipe images
create policy "Family members can upload recipe images"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-images' and
    auth.uid() is not null
  );

create policy "Anyone can view recipe images"
  on storage.objects for select
  using (bucket_id = 'recipe-images');

create policy "Users can update their uploaded images"
  on storage.objects for update
  using (bucket_id = 'recipe-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their uploaded images"
  on storage.objects for delete
  using (bucket_id = 'recipe-images' and auth.uid()::text = (storage.foldername(name))[1]);
