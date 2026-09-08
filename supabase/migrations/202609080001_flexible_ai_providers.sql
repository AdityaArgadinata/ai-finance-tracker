begin;

alter table public.user_ai_settings add column if not exists endpoint text not null default 'https://api.openai.com/v1';
alter table public.user_ai_settings add column if not exists provider text not null default 'custom';

drop function if exists public.set_groq_api_key(text, text);
drop function if exists public.set_groq_api_key(text, text, text, text);

create or replace function public.set_groq_api_key(
  p_api_key text,
  p_model text,
  p_endpoint text default 'https://api.openai.com/v1',
  p_provider text default 'custom'
) returns void language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  existing_secret_id uuid;
  new_secret_id uuid;
  clean_key text;
  clean_model text;
  clean_endpoint text;
  clean_provider text;
begin
  if current_user_id is null then raise exception 'Unauthorized'; end if;
  clean_key := trim(p_api_key);
  clean_model := trim(p_model);
  clean_endpoint := rtrim(trim(p_endpoint), '/');
  clean_provider := trim(lower(coalesce(p_provider, 'custom')));

  if length(clean_key) < 5 or clean_model = '' or clean_endpoint = '' then
    raise exception 'Invalid AI configuration';
  end if;

  select groq_secret_id into existing_secret_id from public.user_ai_settings where user_id = current_user_id;

  if existing_secret_id is null then
    select vault.create_secret(clean_key, 'ai_key_' || current_user_id::text, 'AI API key for Expanse user') into new_secret_id;
    insert into public.user_ai_settings (user_id, groq_secret_id, key_hint, model, endpoint, provider)
    values (
      current_user_id,
      new_secret_id,
      case
        when length(clean_key) <= 8 then '••••' || right(clean_key, 2)
        else left(clean_key, 3) || '••••' || right(clean_key, 4)
      end,
      clean_model,
      clean_endpoint,
      clean_provider
    );
  else
    perform vault.update_secret(existing_secret_id, clean_key);
    update public.user_ai_settings
    set key_hint = case
          when length(clean_key) <= 8 then '••••' || right(clean_key, 2)
          else left(clean_key, 3) || '••••' || right(clean_key, 4)
        end,
        model = clean_model,
        endpoint = clean_endpoint,
        provider = clean_provider,
        updated_at = now()
    where user_id = current_user_id;
  end if;
end;
$$;

revoke all on function public.set_groq_api_key(text, text, text, text) from public, anon, authenticated;
grant execute on function public.set_groq_api_key(text, text, text, text) to authenticated;

commit;
