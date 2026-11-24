-- Cms-Edm : sécurité de la connexion et restauration des versions (24 nov. 2026)

-- 1. Les droits (invitations, super-administrateur) ne sont accordés qu'après confirmation de l'adresse e-mail
create or replace function public.grant_invites(uid uuid, mail text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
  update profiles set is_superadmin = true
    where id = uid and exists(select 1 from bootstrap_superadmins b where lower(b.email)=lower(mail));
  insert into site_members(site_id, user_id, role)
    select site_id, uid, role from site_invites where lower(email) = lower(mail)
    on conflict do nothing;
  delete from site_invites where lower(email) = lower(mail);
end $$;
revoke execute on function public.grant_invites(uuid, text) from public, anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  insert into profiles(id, email, is_superadmin) values (new.id, new.email, false) on conflict (id) do nothing;
  if new.email_confirmed_at is not null then perform public.grant_invites(new.id, new.email); end if;
  return new;
end $$;

create or replace function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.grant_invites(new.id, new.email);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_confirmed() from public, anon, authenticated;

-- comptes non confirmés : droits retirés jusqu'à confirmation (rendus automatiquement ensuite)
update profiles p set is_superadmin = false from auth.users u
  where u.id = p.id and u.email_confirmed_at is null and p.is_superadmin;

-- 2. Un utilisateur ne peut pas modifier l'adresse e-mail de son profil (utilisée pour les invitations)
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid()
    and is_superadmin = (select p.is_superadmin from profiles p where p.id = auth.uid())
    and email is not distinct from (select p.email from profiles p where p.id = auth.uid()));

-- 3. Le dossier d'hébergement et l'identifiant d'un site ne sont modifiables que par un super-administrateur
create or replace function public.guard_sites_update() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is not null and not public.is_superadmin()
     and (new.dossier_ftp is distinct from old.dossier_ftp or new.slug is distinct from old.slug
          or new.parent_id is distinct from old.parent_id or new.theme is distinct from old.theme) then
    raise exception 'Seul un super-administrateur peut modifier le dossier d''hébergement ou l''identifiant du site';
  end if;
  return new;
end $$;
drop trigger if exists guard_sites_update on public.sites;
create trigger guard_sites_update before update on public.sites for each row execute function public.guard_sites_update();
revoke execute on function public.guard_sites_update() from public, anon, authenticated;

create or replace function public.create_site(p_slug text, p_nom text, p_domaine text default null, p_dossier text default null, p_from uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare nid uuid; src record;
begin
  if not public.is_superadmin() and (p_from is null or public.site_role(p_from) <> 'admin') then
    raise exception 'Seul un super-administrateur, ou l''administrateur du site d''origine, peut créer un site';
  end if;
  if not public.is_superadmin() then p_dossier := null; end if;
  insert into sites(slug, nom, domaine, dossier_ftp, parent_id, created_by)
    values (p_slug, p_nom, p_domaine, p_dossier, p_from, auth.uid()) returning id into nid;
  insert into site_members(site_id, user_id, role) values (nid, auth.uid(), 'admin');
  if p_from is not null then
    select * into src from contents where site_id = p_from;
    insert into contents(site_id, draft, draft_at, draft_by) values (nid, coalesce(src.draft, src.published), now(), auth.uid());
  else
    insert into contents(site_id) values (nid);
  end if;
  return nid;
end $$;

-- 4. Restauration d'une version antérieure : republiée comme nouvelle version, puis régénération
create or replace function public.restore_version(p_site uuid, p_version bigint) returns bigint
language plpgsql security definer set search_path to 'public' as $$
declare c jsonb;
begin
  if not public.can_publish(p_site) then raise exception 'Seuls les validateurs et administrateurs peuvent restaurer une version'; end if;
  select content into c from versions where id = p_version and site_id = p_site;
  if c is null then raise exception 'Version introuvable'; end if;
  return public.publish_site(p_site, c, 'Restauration de la version ' || p_version);
end $$;

-- 5. Fonctions réservées aux personnes connectées
revoke execute on function public.restore_version(uuid, bigint) from public, anon;
grant execute on function public.restore_version(uuid, bigint) to authenticated;
revoke execute on function public.create_site(text, text, text, text, uuid) from public, anon;
revoke execute on function public.publish_site(uuid, jsonb, text) from public, anon;
revoke execute on function public.save_draft(uuid, jsonb, text) from public, anon;
grant execute on function public.create_site(text, text, text, text, uuid), public.publish_site(uuid, jsonb, text), public.save_draft(uuid, jsonb, text) to authenticated;
