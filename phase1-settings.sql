-- =========================================================
-- Phase 1 settings: unified control codes + support link
-- Safe upsert. Run once in Supabase SQL Editor.
-- =========================================================
insert into public.app_settings (key, value)
values
  ('control_codes', '{"mahmoud":"2026","ziad":"9090","max_attempts":5,"lock_minutes":10}'::jsonb),
  ('support_link', '{"url":"https://t.me/Mahmoud_M_Hassan101BOT"}'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
