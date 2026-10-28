-- =====================================================================
--  Effectra – Datenbank für Supabase
--  Einmal komplett im Supabase SQL Editor ausführen (neues Projekt).
--
--  Sicherheitsprinzip:
--  * Jede Tabelle hat Row Level Security (RLS). Ohne passende Regel
--    sieht oder ändert niemand etwas.
--  * Daten gehören immer zu einem Team (workspace). Nur Mitglieder
--    dieses Teams können sie lesen und schreiben.
--  * Man wird nur über einen Einladungscode Mitglied (Funktion
--    join_workspace). Direktes Eintragen in workspace_members ist gesperrt.
--  * Felder wie created_by, done_at, author werden vom Server gesetzt
--    und lassen sich vom Browser aus nicht fälschen.
--  * Nicht angemeldete Besucher (anon) haben auf nichts Zugriff.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
--  Tabellen
-- ---------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at   timestamptz not null default now()
);

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  invite_code text not null unique,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  color        text not null default 'blue'
               check (color in ('blue', 'green', 'orange', 'red', 'purple', 'teal', 'pink', 'gray')),
  due          date,
  created_at   timestamptz not null default now(),
  unique (id, workspace_id)
);
create index projects_ws_idx on public.projects (workspace_id);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  notes        text not null default '' check (char_length(notes) <= 5000),
  status       text not null default 'offen' check (status in ('offen', 'arbeit', 'erledigt')),
  priority     smallint not null default 2 check (priority between 1 and 3),
  due          date,
  assignee     uuid references auth.users (id) on delete set null,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  done_at      timestamptz,
  unique (id, workspace_id),
  -- Ein Projekt muss zum selben Team gehören wie die Aufgabe.
  foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id) on delete set null (project_id)
);
create index tasks_ws_idx on public.tasks (workspace_id);

create table public.subtasks (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null,
  workspace_id uuid not null,
  title        text not null check (char_length(btrim(title)) between 1 and 200),
  done         boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (task_id, workspace_id)
    references public.tasks (id, workspace_id) on delete cascade
);
create index subtasks_ws_idx on public.subtasks (workspace_id);

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null,
  workspace_id uuid not null,
  author       uuid references auth.users (id) on delete set null,
  body         text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at   timestamptz not null default now(),
  foreign key (task_id, workspace_id)
    references public.tasks (id, workspace_id) on delete cascade
);
create index comments_ws_idx on public.comments (workspace_id);

create table public.activity (
  id           bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor        uuid references auth.users (id) on delete set null,
  kind         text not null,
  task_id      uuid,
  title        text not null default '',
  created_at   timestamptz not null default now()
);
create index activity_ws_idx on public.activity (workspace_id, id desc);

-- ---------------------------------------------------------------------
--  Hilfsfunktionen für die Regeln
--  (security definer, damit die Regeln sich nicht gegenseitig blockieren)
-- ---------------------------------------------------------------------

create or replace function public.is_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.shares_workspace(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_members a
    join public.workspace_members b on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function public.new_invite_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 Zeichen, ohne 0/O/1/I
  bytes bytea := extensions.gen_random_bytes(10);
  code text := '';
  i int;
begin
  for i in 0..9 loop
    code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

-- Aktivität mitschreiben (nur der Server schreibt hier hinein)
create or replace function public.log_activity(ws uuid, k text, t uuid, ttl text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity (workspace_id, actor, kind, task_id, title)
  values (ws, auth.uid(), k, t, left(coalesce(ttl, ''), 200));
  -- Verlauf klein halten: nur die neuesten 300 Einträge pro Team
  delete from public.activity
  where workspace_id = ws
    and id < (select id from public.activity where workspace_id = ws
              order by id desc offset 299 limit 1);
end;
$$;

-- ---------------------------------------------------------------------
--  Trigger
-- ---------------------------------------------------------------------

-- Profil automatisch anlegen, wenn sich jemand registriert
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Aufgaben: Server-Felder schützen, Zuständige prüfen
create or replace function public.tasks_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if new.status = 'erledigt' then new.done_at := now(); else new.done_at := null; end if;
  else
    new.workspace_id := old.workspace_id;
    new.created_by   := old.created_by;
    new.created_at   := old.created_at;
    if new.status = 'erledigt' and old.status <> 'erledigt' then
      new.done_at := now();
    elsif new.status <> 'erledigt' then
      new.done_at := null;
    else
      new.done_at := old.done_at;
    end if;
  end if;
  new.updated_at := now();
  new.title := btrim(new.title);
  if new.assignee is not null and not exists (
    select 1 from public.workspace_members
    where workspace_id = new.workspace_id and user_id = new.assignee
  ) then
    raise exception 'Zuständige Person ist nicht im Team' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger tasks_guard before insert or update on public.tasks
  for each row execute function public.tasks_guard();

create or replace function public.tasks_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.workspace_id, 'created', new.id, new.title);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    perform public.log_activity(new.workspace_id,
      case new.status when 'erledigt' then 'done' when 'arbeit' then 'started' else 'reopened' end,
      new.id, new.title);
  elsif tg_op = 'DELETE' then
    if exists (select 1 from public.workspaces where id = old.workspace_id) then
      perform public.log_activity(old.workspace_id, 'deleted', old.id, old.title);
    end if;
  end if;
  return null;
end;
$$;
create trigger tasks_log after insert or update or delete on public.tasks
  for each row execute function public.tasks_log();

-- Projekte, Unteraufgaben: Zugehörigkeit nicht umhängbar
create or replace function public.keep_workspace()
returns trigger language plpgsql set search_path = public as $$
begin
  new.workspace_id := old.workspace_id;
  return new;
end;
$$;
create trigger projects_keep before update on public.projects
  for each row execute function public.keep_workspace();

create or replace function public.subtasks_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  new.workspace_id := old.workspace_id;
  new.task_id := old.task_id;
  new.created_at := old.created_at;
  return new;
end;
$$;
create trigger subtasks_guard before update on public.subtasks
  for each row execute function public.subtasks_guard();

-- Kommentare: Autor ist immer die angemeldete Person
create or replace function public.comments_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.author := auth.uid();
    new.created_at := now();
  else
    new.author := old.author;
    new.task_id := old.task_id;
    new.workspace_id := old.workspace_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
create trigger comments_guard before insert or update on public.comments
  for each row execute function public.comments_guard();

create or replace function public.comments_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity(new.workspace_id, 'comment', new.task_id,
    (select title from public.tasks where id = new.task_id));
  return null;
end;
$$;
create trigger comments_log after insert on public.comments
  for each row execute function public.comments_log();

-- Wer das Team verlässt, verliert seine Zuständigkeiten
create or replace function public.members_cleanup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.tasks set assignee = null
  where workspace_id = old.workspace_id and assignee = old.user_id;
  return null;
end;
$$;
create trigger members_cleanup after delete on public.workspace_members
  for each row execute function public.members_cleanup();

-- ---------------------------------------------------------------------
--  Funktionen, die die App aufruft
-- ---------------------------------------------------------------------

create or replace function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ws uuid;
begin
  if uid is null then raise exception 'Nicht angemeldet' using errcode = '28000'; end if;
  if (select count(*) from public.workspaces where owner_id = uid) >= 5 then
    raise exception 'Du kannst höchstens 5 Teams anlegen' using errcode = '54000';
  end if;
  insert into public.workspaces (name, invite_code, owner_id)
  values (btrim(p_name), public.new_invite_code(), uid)
  returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, uid, 'owner');
  return ws;
end;
$$;

create or replace function public.join_workspace(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ws uuid;
begin
  if uid is null then raise exception 'Nicht angemeldet' using errcode = '28000'; end if;
  select id into ws from public.workspaces
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if ws is null then raise exception 'Einladungscode ungültig' using errcode = 'P0002'; end if;
  if exists (select 1 from public.workspace_members where workspace_id = ws and user_id = uid) then
    return ws;
  end if;
  if (select count(*) from public.workspace_members where workspace_id = ws) >= 25 then
    raise exception 'Das Team ist voll (25 Personen)' using errcode = '54000';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, uid, 'member');
  perform public.log_activity(ws, 'joined', null, '');
  return ws;
end;
$$;

create or replace function public.rotate_invite_code(p_ws uuid)
returns text language plpgsql security definer set search_path = public as $$
declare code text;
begin
  if not public.is_owner(p_ws) then
    raise exception 'Nur der Team-Besitzer kann den Code ändern' using errcode = '42501';
  end if;
  code := public.new_invite_code();
  update public.workspaces set invite_code = code where id = p_ws;
  return code;
end;
$$;

-- ---------------------------------------------------------------------
--  Rechte: anon bekommt nichts, angemeldete nur das Nötige
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, public;

grant execute on function public.is_member(uuid), public.is_owner(uuid), public.shares_workspace(uuid),
  public.create_workspace(text), public.join_workspace(text), public.rotate_invite_code(uuid)
  to authenticated;

grant select, insert, update, delete on public.projects, public.tasks, public.subtasks to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, delete on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;
grant select, delete on public.workspace_members to authenticated;
grant select on public.activity to authenticated;

-- ---------------------------------------------------------------------
--  Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.subtasks          enable row level security;
alter table public.comments          enable row level security;
alter table public.activity          enable row level security;

create policy "profiles: sich selbst und Teamkollegen sehen" on public.profiles
  for select to authenticated using (id = auth.uid() or public.shares_workspace(id));
create policy "profiles: nur eigenes Profil ändern" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces: Mitglieder sehen ihr Team" on public.workspaces
  for select to authenticated using (public.is_member(id));
create policy "workspaces: Besitzer benennt um" on public.workspaces
  for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));
create policy "workspaces: Besitzer löscht" on public.workspaces
  for delete to authenticated using (public.is_owner(id));

create policy "members: Mitglieder sehen das Team" on public.workspace_members
  for select to authenticated using (public.is_member(workspace_id));
create policy "members: selbst austreten oder Besitzer entfernt" on public.workspace_members
  for delete to authenticated using (
    (user_id = auth.uid() and role <> 'owner')
    or (public.is_owner(workspace_id) and user_id <> auth.uid())
  );

create policy "projects: nur Mitglieder" on public.projects
  for all to authenticated
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

create policy "tasks: nur Mitglieder" on public.tasks
  for all to authenticated
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

create policy "subtasks: nur Mitglieder" on public.subtasks
  for all to authenticated
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

create policy "comments: Mitglieder lesen" on public.comments
  for select to authenticated using (public.is_member(workspace_id));
create policy "comments: Mitglieder schreiben" on public.comments
  for insert to authenticated with check (public.is_member(workspace_id));
create policy "comments: nur eigene ändern" on public.comments
  for update to authenticated
  using (author = auth.uid() and public.is_member(workspace_id))
  with check (author = auth.uid() and public.is_member(workspace_id));
create policy "comments: eigene oder als Besitzer löschen" on public.comments
  for delete to authenticated
  using (public.is_member(workspace_id) and (author = auth.uid() or public.is_owner(workspace_id)));

create policy "activity: Mitglieder lesen" on public.activity
  for select to authenticated using (public.is_member(workspace_id));

-- ---------------------------------------------------------------------
--  Echtzeit-Sync (Supabase Realtime beachtet die Regeln oben)
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['projects', 'tasks', 'subtasks', 'comments', 'workspace_members', 'activity', 'workspaces'] loop
      if not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
