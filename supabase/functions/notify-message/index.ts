// Cms-Edm : envoie un e-mail à l'équipe à chaque nouveau message du formulaire de contact.
// Appelée par un déclencheur de la table public.messages (pg_net) avec {"id": ...}.
// Le message est relu en base : seul un message réel et non encore signalé déclenche un envoi.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const DEST: Record<string, string> = { "ecole-edm": "info@ecole-edm.fr" };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    if (!id) return new Response("id manquant", { status: 400 });
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: m } = await sb.from("messages").select("*").eq("id", id).maybeSingle();
    if (!m) return new Response("introuvable", { status: 404 });
    if (m.notifie_at) return new Response("déjà signalé");
    const to = Deno.env.get("NOTIFY_TO_" + String(m.site_slug).toUpperCase().replace(/-/g, "_")) || DEST[m.site_slug] || "info@ecole-edm.fr";
    const pass = Deno.env.get("SMTP_PASS");
    if (!pass) return new Response("SMTP_PASS non configuré", { status: 500 });
    const t = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST") || "smtp.titan.email", port: 465, secure: true,
      auth: { user: Deno.env.get("SMTP_USER") || "noreply@design-mutation.org", pass },
    });
    const nom = `${m.prenom || ""} ${m.nom || ""}`.trim() || m.email;
    const date = new Date(m.created_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });
    await t.sendMail({
      from: `"Site ecole-edm.fr" <${Deno.env.get("SMTP_USER") || "noreply@design-mutation.org"}>`,
      to, replyTo: m.email ? `"${nom.replace(/"/g, "")}" <${m.email}>` : undefined,
      subject: `Nouveau message de contact - ${nom}${m.profil ? " (" + m.profil + ")" : ""}`,
      text: `Message reçu le ${date} via le formulaire de contact.\n\nNom : ${nom}\nE-mail : ${m.email}\nProfil : ${m.profil || "-"}\n\n${m.message}\n\nRépondez directement à cet e-mail pour écrire à l'expéditeur.\nTous les messages : https://cms.ecole-edm.fr/ (bouton « Messages »).`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1d3557;max-width:620px">
<p style="color:#666">Message reçu le ${esc(date)} via le formulaire de contact.</p>
<p><b>${esc(nom)}</b> - <a href="mailto:${esc(m.email)}">${esc(m.email)}</a><br>Profil : ${esc(m.profil || "-")}</p>
<div style="border-left:4px solid #E85D5D;padding:10px 16px;background:#fdf3f2;white-space:pre-wrap">${esc(m.message)}</div>
<p style="color:#666;font-size:13px">Répondez directement à cet e-mail pour écrire à l'expéditeur.<br>Tous les messages : <a href="https://cms.ecole-edm.fr/">cms.ecole-edm.fr</a>, bouton « Messages ».</p></div>`,
    });
    await sb.from("messages").update({ notifie_at: new Date().toISOString() }).eq("id", id);
    return new Response("envoyé");
  } catch (e) {
    console.error(e);
    return new Response("erreur : " + (e as Error).message, { status: 500 });
  }
});
