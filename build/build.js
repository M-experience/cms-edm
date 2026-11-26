// Cms-Edm : génération statique des sites publiés et dépôt sur l'hébergement.
// Variables : SUPABASE_URL, SUPABASE_SERVICE_KEY, FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, SITE (facultatif : identifiant d'un site)
const fs=require('fs'),path=require('path');
const ASSET_V=require('crypto').createHash('md5').update(require('fs').readFileSync(require('path').join(__dirname,'../render/site.css'))+require('fs').readFileSync(require('path').join(__dirname,'../render/site.js'))).digest('hex').slice(0,8);
const PREVIEW_HOST='apercu.ecole-edm.fr',PREVIEW_DIR='/public_html/apercu';
const R=require('../render/render.js');
const URL_=process.env.SUPABASE_URL||'https://gtletlvgbjqqjnmhjdfd.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_KEY;
if(!KEY){console.log('SUPABASE_SERVICE_KEY absent des secrets GitHub : génération ignorée.');process.exit(0);}
const H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const api=async(p,opt={})=>{const r=await fetch(URL_+'/rest/v1/'+p,{...opt,headers:{...H,...(opt.headers||{})}});if(!r.ok)throw new Error(p+' : '+r.status+' '+await r.text());return r.status===204?null:r.json();};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ROOT=path.join(__dirname,'..');
const PUBLISHABLE='sb_publishable_1BYm4PUC-4xmylhcinXznA_2u-F5zEp';

function shell(C,site,pg,html,base){
 const seo=(C.seo&&C.seo[pg.route])||{};
 const t=seo.titre||(pg.route==='accueil'?C.site.nom:(pg.titre+' | '+C.site.nom));
 const plain=html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 const desc=seo.description||(pg.route==='accueil'?C.site.slogan:'')||plain.slice(0,180);
 const og=(html.match(/<img[^>]+src="([^"]+\.(?:jpg|jpeg|webp))"/i)||[])[1];
 const abs=u=>!u?'':(/^https?:/.test(u)?u:base+u.replace(/^\//,''));
 const url=base+(pg.path?pg.path+'/':'');
 return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title><meta name="description" content="${esc(desc.replace(/\n/g,' ').slice(0,300))}">
<link rel="canonical" href="${esc(url)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(desc.replace(/\n/g,' ').slice(0,200))}"><meta property="og:url" content="${esc(url)}">${og?`<meta property="og:image" content="${esc(abs(og))}">`:''}
<link rel="icon" href="/img/dots.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="${esc(R.charteFontsURL(C))}" rel="stylesheet">
<link rel="stylesheet" href="/site.css?v=${ASSET_V}"><style>${R.charteCSS(C)}</style>
</head><body class="site">
${html}
<script>window.CMS={url:${JSON.stringify(URL_)},key:${JSON.stringify(PUBLISHABLE)},site:${JSON.stringify(site.slug)}};</script><script src="/site.js?v=${ASSET_V}" defer></script>
</body></html>`;
}

async function buildSite(site,content){
 const theme=site.theme||'edm';
 const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'themes',theme,'content.json'),'utf8'));
 R.setOrigin(raw);R.setMode('static','/');
 const C=R.norm(JSON.parse(JSON.stringify(content||raw)));
 const out=path.join(ROOT,'dist',site.slug);fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const preview=!site.dossier_ftp;const prefix=preview?'/'+site.slug+'/':'/';
 const base=preview?'https://'+PREVIEW_HOST+prefix:(site.domaine?'https://'+site.domaine.replace(/^https?:\/\//,'').replace(/\/$/,'')+'/':'/');
 const fix=h=>preview?h.replace(/(href|src|action)="\/(?!\/)/g,'$1="'+prefix).replace('<head>','<head><meta name="robots" content="noindex">'):h;
 const pages=R.sitePages(C);
 for(const pg of pages){const dir=pg.path?path.join(out,pg.path):out;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),fix(shell(C,site,pg,R.renderPage(C,pg.route),base)));}
 // ressources
 fs.cpSync(path.join(ROOT,'themes',theme,'img'),path.join(out,'img'),{recursive:true});
 fs.copyFileSync(path.join(ROOT,'render','site.css'),path.join(out,'site.css'));
 fs.copyFileSync(path.join(ROOT,'render','site.js'),path.join(out,'site.js'));
 // 404, plan du site, robots, .htaccess (Hostinger / Apache)
 fs.writeFileSync(path.join(out,'404.html'),fix(shell(C,site,{route:'accueil',titre:'Page introuvable',path:''},`<section class="blk"><div class="wrap"><h1>Page introuvable</h1><p>Cette page n'existe pas ou a été déplacée.</p><p><a class="btn" href="/">Retour à l'accueil</a></p></div></section>`,base)));
 fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p=>`<url><loc>${base}${p.path?p.path+'/':''}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod><priority>${!p.path?'1.0':/^master/.test(p.route)?'0.9':/legales|conditions|confidentialite/.test(p.path)?'0.2':'0.7'}</priority></url>`).join('\n')}\n</urlset>\n`);
 fs.writeFileSync(path.join(out,'robots.txt'),preview?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
 const sec=[...new Set([...(site.domaines_secondaires||[]),...(site.domaine&&!/^www\./.test(site.domaine)?['www.'+site.domaine]:[])].filter(Boolean))];
 if(preview){fs.writeFileSync(path.join(out,'.htaccess'),`ErrorDocument 404 ${prefix}404.html\nOptions -Indexes\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n`);return out;}
 fs.writeFileSync(path.join(out,'.htaccess'),`ErrorDocument 404 /404.html
Options -Indexes
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
${site.domaine?sec.map(d=>`RewriteCond %{HTTP_HOST} ^${d.replace(/\./g,'\\.')}$ [NC]\nRewriteRule ^ https://${site.domaine}%{REQUEST_URI} [L,R=301]`).join('\n'):''}
# anciennes adresses du site Wix
RewriteRule ^mentions-l[^e/]+gales/?$ /mentions-legales/ [L,R=301]
RewriteRule ^politique-de-confidentialit[^e/]+/?$ /politique-de-confidentialite/ [L,R=301]
RewriteRule ^vie-des-masters/?$ /vie-masters/ [L,R=301]
# restes de l'ancien site Wix signalés par Google Search Console
RewriteRule ^politique-de-cookies/?$ /politique-de-confidentialite/ [L,R=301]
RewriteRule ^profile/ /ecole/#s-equipe [L,R=301,NE]
RewriteRule ^post/ /vie-masters/ [L,R=301]
RewriteRule ^service-page/ / [L,R=301]
RewriteRule ^book-online/?$ /contact/ [L,R=301]
RewriteRule ^(copie-de-accueil|backup-id|pricing-plans|_api/) - [G,L]
# anciennes pages de design-mutation.org (domaine redirigé vers ce site)
RewriteRule ^master-transition-numerique-responsable-codesign/?$ /mastertnr/ [L,R=301]
RewriteRule ^master-communication-innovation-mediations-etudes/?$ /mastercime/ [L,R=301]
RewriteRule ^(about|2281-2)/?$ /ecole/ [L,R=301]
RewriteRule ^contact-2/?$ /contact/ [L,R=301]
RewriteRule ^(home-2|services|licence|formation-continue|prospective-metiers-2)/?$ / [L,R=301]
RewriteRule ^(nabila-ait-samadi|thierry-curiale|naik-guezel|aline-gerard|francois-silva|julie-credou|sylvie-parrini-alemanno|marianne-lorthiois|manuel-zacklad|taha-jaidi)/?$ /ecole/#s-equipe [L,R=301,NE]
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/jpeg "access plus 1 month"
ExpiresByType image/png "access plus 1 month"
ExpiresByType image/svg+xml "access plus 1 month"
ExpiresByType text/css "access plus 1 day"
ExpiresByType application/javascript "access plus 1 day"
</IfModule>
`);
 return out;
}

async function deploy(site,dir){
 const {FTP_SERVER,FTP_USERNAME,FTP_PASSWORD}=process.env;
 const target=site.dossier_ftp||(PREVIEW_DIR+'/'+site.slug);
 if(!FTP_SERVER||!FTP_USERNAME||!FTP_PASSWORD){return 'généré, non déposé : identifiants FTP absents des secrets GitHub';}
 const ftp=require('basic-ftp');let c=new ftp.Client(60000);
 try{const host=FTP_SERVER.replace(/^ftps?:\/\//,'').replace(/\/.*$/,'').trim();
  try{await c.access({host,user:FTP_USERNAME,password:FTP_PASSWORD,secure:true,secureOptions:{rejectUnauthorized:false}});}
  catch(e){console.log('FTPS indisponible ('+e.message+'), connexion FTP simple');c.close();c=new ftp.Client(60000);await c.access({host,user:FTP_USERNAME,password:FTP_PASSWORD,secure:false});}
  await c.ensureDir(target);await c.uploadFromDir(dir);return site.dossier_ftp?'déposé dans '+target:'en ligne temporaire : https://'+PREVIEW_HOST+'/'+site.slug+'/';}
 finally{c.close();}
}

(async()=>{
 const only=process.env.SITE;
 let pending=await api('builds?status=eq.en_attente&select=id,site_id,version_id&order=created_at');
 const sites=await api('sites?select=*'+(only?'&slug=eq.'+encodeURIComponent(only):'&statut=eq.actif'));
 let targets;
 if(only){targets=sites.map(s=>({site:s,builds:pending.filter(b=>b.site_id===s.id)}));}
 else{const ids=[...new Set(pending.map(b=>b.site_id))];targets=ids.map(id=>({site:sites.find(s=>s.id===id),builds:pending.filter(b=>b.site_id===id)})).filter(t=>t.site);}
 if(!targets.length){console.log('Aucune génération en attente.');return;}
 let fail=false;
 for(const {site,builds} of targets){
  const ids=builds.map(b=>b.id);const setStatus=(o)=>ids.length?api('builds?id=in.('+ids.join(',')+')',{method:'PATCH',body:JSON.stringify(o),headers:{Prefer:'return=minimal'}}):null;
  try{await setStatus({status:'en_cours'});
   const [c]=await api('contents?site_id=eq.'+site.id+'&select=published');
   if(!c||!c.published)throw new Error('aucun contenu publié');
   const dir=await buildSite(site,c.published);const r=await deploy(site,dir);
   console.log(site.slug+' : '+r);await setStatus({status:'ok',log:r,finished_at:new Date().toISOString()});}
  catch(e){fail=true;console.error(site.slug+' : '+e.message);await setStatus({status:'erreur',log:String(e.message).slice(0,1000),finished_at:new Date().toISOString()});}
 }
 if(fail)process.exitCode=1;
})();
