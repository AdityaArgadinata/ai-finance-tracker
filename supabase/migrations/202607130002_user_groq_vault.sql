begin;

create extension if not exists supabase_vault with schema vault;

create table if not exists public.user_ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  groq_secret_id uuid not null,
  key_hint text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_ai_settings enable row level security;

drop policy if exists "Users can read own AI settings" on public.user_ai_settings;
create policy "Users can read own AI settings" on public.user_ai_settings for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_groq_api_key(p_api_key text) returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  existing_secret_id uuid;
  new_secret_id uuid;
begin
  if current_user_id is null then raise exception 'Unauthorized'; end if;
  p_api_key := trim(p_api_key);
  if length(p_api_key) < 20 or p_api_key not like 'gsk_%' then raise exception 'Invalid Groq API key'; end if;
  select groq_secret_id into existing_secret_id from public.user_ai_settings where user_id = current_user_id;
  if existing_secret_id is null then
    select vault.create_secret(p_api_key, 'groq_' || current_user_id::text, 'Groq API key for Expanse user') into new_secret_id;
    insert into public.user_ai_settings (user_id, groq_secret_id, key_hint) values (current_user_id, new_secret_id, 'gsk_••••' || right(p_api_key, 4));
  else
    perform vault.update_secret(existing_secret_id, p_api_key);
    update public.user_ai_settings set key_hint = 'gsk_••••' || right(p_api_key, 4), updated_at = now() where user_id = current_user_id;
  end if;
end;
$$;

create or replace function public.remove_groq_api_key() returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  existing_secret_id uuid;
begin
  if current_user_id is null then raise exception 'Unauthorized'; end if;
  delete from public.user_ai_settings where user_id = current_user_id returning groq_secret_id into existing_secret_id;
  if existing_secret_id is not null then delete from vault.secrets where id = existing_secret_id; end if;
end;
$$;

create or replace function public.get_groq_api_key(p_user_id uuid) returns text language sql security definer set search_path = '' stable as $$
  select decrypted.decrypted_secret from public.user_ai_settings settings join vault.decrypted_secrets decrypted on decrypted.id = settings.groq_secret_id where settings.user_id = p_user_id;
$$;

revoke all on function public.set_groq_api_key(text) from public, anon, authenticated;
revoke all on function public.remove_groq_api_key() from public, anon, authenticated;
revoke all on function public.get_groq_api_key(uuid) from public, anon, authenticated;
grant execute on function public.set_groq_api_key(text) to authenticated;
grant execute on function public.remove_groq_api_key() to authenticated;
grant execute on function public.get_groq_api_key(uuid) to service_role;

commit;
