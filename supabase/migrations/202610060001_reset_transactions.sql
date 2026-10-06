begin;

create or replace function public.reset_transactions() returns void
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Unauthorized'; end if;

  delete from public.transactions where user_id = current_user_id;
end;
$$;

revoke all on function public.reset_transactions() from public, anon, authenticated;
grant execute on function public.reset_transactions() to authenticated;

commit;
