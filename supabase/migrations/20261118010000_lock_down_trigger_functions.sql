-- =============================================================================
-- Trigger functions are only meant to run from their triggers. Stop them from
-- being exposed as RPC endpoints (/rest/v1/rpc/...) to anon / authenticated.
-- Triggers keep working: EXECUTE is not checked when a trigger fires.
-- =============================================================================

revoke execute on function public.normalize_post()  from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
