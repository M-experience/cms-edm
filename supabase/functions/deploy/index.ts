// Cms-Edm : déclenche la génération du site après une publication.
// Secret facultatif GITHUB_TOKEN (jeton GitHub limité au dépôt cms-edm, droit « Contents: write »).
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { site_id } = await req.json();
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: ok, error } = await sb.rpc("can_publish", { s: site_id });
    if (error || !ok) return json({ dispatched: false, reason: "droits insuffisants" }, 403);
    const { data: site } = await sb.from("sites").select("slug").eq("id", site_id).single();
    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) return json({ dispatched: false, reason: "GITHUB_TOKEN absent : génération par la tâche planifiée" });
    const r = await fetch("https://api.github.com/repos/M-experience/cms-edm/dispatches", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "cms-edm" },
      body: JSON.stringify({ event_type: "cms-build", client_payload: { site: site?.slug } }),
    });
    return json({ dispatched: r.status === 204, status: r.status });
  } catch (e) {
    return json({ dispatched: false, reason: String(e) }, 500);
  }
});
