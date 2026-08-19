begin;

alter table public.user_ai_settings add column if not exists model text not null default 'if/kimi-k2';

drop function if exists public.set_groq_api_key(text);
create function public.set_groq_api_key(p_api_key text, p_model text) returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  existing_secret_id uuid;
  new_secret_id uuid;
begin
  if current_user_id is null then raise exception 'Unauthorized'; end if;
  p_api_key := trim(p_api_key);
  p_model := trim(p_model);
  if length(p_api_key) < 20 or p_api_key not like 'sk%' or p_model = '' then raise exception 'Invalid 9Router configuration'; end if;
  select groq_secret_id into existing_secret_id from public.user_ai_settings where user_id = current_user_id;
  if existing_secret_id is null then
    select vault.create_secret(p_api_key, '9router_' || current_user_id::text, '9Router API key for Expanse user') into new_secret_id;
    insert into public.user_ai_settings (user_id, groq_secret_id, key_hint, model) values (current_user_id, new_secret_id, left(p_api_key, 3) || '••••' || right(p_api_key, 4), p_model);
  else
    perform vault.update_secret(existing_secret_id, p_api_key);
    update public.user_ai_settings set key_hint = left(p_api_key, 3) || '••••' || right(p_api_key, 4), model = p_model, updated_at = now() where user_id = current_user_id;
  end if;
end;
$$;

revoke all on function public.set_groq_api_key(text, text) from public, anon, authenticated;
grant execute on function public.set_groq_api_key(text, text) to authenticated;

commit;
