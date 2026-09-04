-- Team logos ("faces") were fetched from ESPN's team payload but never
-- persisted anywhere, so the UI had nothing to render. Add a column for it.

alter table team_registry add column if not exists logo_url text;
