let ORIGIN_PAGES=[];
/* ============ utilitaires ============ */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inl=x=>esc(x).replace(/==(.+?)==/g,'<mark class="hl">$1</mark>').replace(/\[([^\]]+)\]\(([^)\s]+)\)\{bouton\}/g,(m,a,u)=>/^(https?:|mailto:|#|\/)/.test(u)?`<a class="mdbtn" href="${u}">${a}</a>`:a).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g,'$1<em>$2</em>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,a,u)=>/^(https?:|mailto:|#|\/)/.test(u)?`<a href="${u}">${a}</a>`:a);
function md(t){return String(t||'').split(/\n\s*\n/).filter(b=>b.trim()).map(b=>{const L=b.trim().split('\n');
 if(L.every(l=>/^\s*>/.test(l)))return '<blockquote class="callout"><p>'+L.map(l=>inl(l.replace(/^\s*>\s?/,''))).join('<br>')+'</p></blockquote>';
 if(L.every(l=>/^\s*[-•]\s+/.test(l)))return '<ul>'+L.map(l=>'<li>'+inl(l.replace(/^\s*[-•]\s+/,''))+'</li>').join('')+'</ul>';
 if(L.every(l=>/^\s*\d+[.)]\s+/.test(l)))return '<ol>'+L.map(l=>'<li>'+inl(l.replace(/^\s*\d+[.)]\s+/,''))+'</li>').join('')+'</ol>';
 if(/^#{2,3}\s/.test(L[0])){const h='<h3 class="mdh">'+inl(L[0].replace(/^#+\s*/,''))+'</h3>';return L.length>1?h+'<p>'+L.slice(1).map(inl).join('<br>')+'</p>':h;}
 const q=b.trim();if(L.length===1&&q.length<70&&q===q.toUpperCase()&&/[A-ZÉÈ]/.test(q)&&!/\*\*/.test(q))return '<p class="tsub">'+esc(q)+'</p>';
 return '<p>'+L.map(inl).join('<br>')+'</p>';}).join('');}
const rich=md,paras=md;
function toMd(root){const blocks=[];let cur='';const flush=()=>{if(cur.trim())blocks.push(cur.trim());cur='';};
 const il=n=>{if(n.nodeType===3)return n.nodeValue.replace(/ /g,' ');if(n.nodeType!==1)return '';const t=n.tagName,c=[...n.childNodes].map(il).join('');
  if(t==='BR')return '\n';if(t==='B'||t==='STRONG')return c.trim()?'**'+c.trim()+'**'+(/\s$/.test(c)?' ':''):c;if(t==='I'||t==='EM')return c.trim()?'*'+c.trim()+'*'+(/\s$/.test(c)?' ':''):c;
  if(t==='MARK')return c.trim()?'=='+c.trim()+'=='+(/\s$/.test(c)?' ':''):c;
  if(t==='A')return '['+c+']('+(n.getAttribute('href')||'')+')'+(n.classList.contains('mdbtn')?'{bouton}':'');if(t==='UL'||t==='OL')return '\n\n'+lst(n)+'\n\n';return c;};
 const lst=n=>[...n.children].map((li,i)=>(n.tagName==='UL'?'- ':(i+1)+'. ')+il(li).replace(/\n+/g,' ').trim()).join('\n');
 for(const n of root.childNodes){const t=n.nodeType===1?n.tagName:'';
  if(t==='UL'||t==='OL'){flush();blocks.push(lst(n));}
  else if(/^H[1-6]$/.test(t)){flush();const v=il(n).replace(/\n+/g,' ').trim();if(v)blocks.push('## '+v);}
  else if(t==='BLOCKQUOTE'){flush();const v=il(n).replace(/\n{2,}/g,'\n').trim();if(v)blocks.push(v.split('\n').map(l=>'> '+l).join('\n'));}
  else if(/^(P|DIV)$/.test(t)){flush();const v=il(n).replace(/\n{3,}/g,'\n\n').trim();if(v)blocks.push(v);}
  else cur+=il(n);}
 flush();return blocks.join('\n\n').replace(/\n{3,}/g,'\n\n');}
const clone=o=>JSON.parse(JSON.stringify(o));
const get=(o,p)=>p.reduce((a,k)=>a==null?a:a[k],o);
const set=(o,p,v)=>{let a=o;for(let i=0;i<p.length-1;i++)a=a[p[i]];a[p[p.length-1]]=v;};
const fmtDate=t=>new Date(t).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2600);}
const IMAGES=['img/equipe-manuel.jpg','img/equipe-sylvie.jpg','img/equipe-francois.jpg','img/prog-cime.jpg','img/prog-tnr.jpg','img/etape1.jpg','img/etape2.jpg','img/etape3.jpg','img/etape4.jpg','img/equipe-thierry.jpg','img/equipe-marianne.jpg','img/equipe-taha.jpg','img/equipe-sarah.jpg','img/equipe-aline.jpg','img/vie-coaching.jpg','img/vie-evenements.jpg','img/vie-enseignement.jpg','img/vie-autogestion.jpg','img/cours.jpg','img/promo-cime.jpg','img/rentree.jpg','img/vie-1.jpg','img/vie-2.jpg','img/cnam.jpg'];

/* ============ rendu du site public ============ */
let EDIT=false;   // vrai pendant le rendu en mode « édition sur la page »
const J=p=>esc(JSON.stringify(p));
const edr=p=>EDIT?` data-e="${J(p)}" data-para="1" data-rich="1" contenteditable="true" spellcheck="true"`:'';
const ed=(p,para)=>EDIT?` data-e="${J(p)}"${para?' data-para="1"':''} contenteditable="plaintext-only" spellcheck="true"`:'';
const itools=(p,i)=>EDIT?`<span class="itools" contenteditable="false"><button data-lidrag="1" data-p="${J(p)}" data-i="${i}" title="Glisser pour déplacer">⠿</button><button data-li="up" data-p="${J(p)}" data-i="${i}" title="Monter">↑</button><button data-li="del" data-p="${J(p)}" data-i="${i}" title="Supprimer">✕</button></span>`:'';
const addBtn=(p,tpl,label='+ Ajouter')=>EDIT?`<button class="eadd" data-add="${J(p)}" data-tpl="${J(tpl)}">${esc(label)}</button>`:'';
const img=(C,p,def,alt='',extra='')=>`<img src="${esc(get(C,p)||def)}" alt="${esc(alt)}"${EDIT?` data-imgp="${J(p)}" title="Cliquer pour changer l'image"`:''}${extra}>`;
const txt=(C,p,tag='span',cls='')=>`<${tag}${cls?` class="${cls}"`:''}${ed(p)}>${esc(get(C,p))}</${tag}>`;
const par=(C,p,cls='prose')=>`<div class="${cls}"${edr(p)}>${paras(get(C,p))||(EDIT?'<p></p>':'')}</div>`;

let MODE='spa',CURRENT_C=null,ASSET_BASE='';
function routePath(c){const C=CURRENT_C;if(!c||c==='accueil')return '/';
 if(c.startsWith('section-'))return '/#s-'+c.slice(8);
 if(c.startsWith('master-')){const sl=c.slice(7);const m=C&&C.masters.find(x=>x.slug===sl);return '/'+((m&&m.chemin)||('master'+sl))+'/';}
 if(c.startsWith('page-')){const [sl,anc]=c.slice(5).split('--');const p=C&&C.pages.find(x=>x.slug===sl);return '/'+((p&&p.chemin)||sl)+'/'+(anc?'#s-'+anc:'');}
 return '/';}
let PREVIEW_SLUG='';
const href=c=>/^(https?:|mailto:|tel:)/.test(c||'')?c:(MODE==='static'?routePath(c):MODE==='preview'?'#/apercu/'+PREVIEW_SLUG+'/'+(c||'accueil'):'#'+(c||'accueil'));
const asset=u=>(u&&/^img\//.test(u))?ASSET_BASE+u:u;
const szb=(p,def)=>EDIT?`<span class="szb" contenteditable="false"><button data-size="-1" data-sp="${J(p)}" data-sdef="${def}" title="Réduire">−</button><button data-size="1" data-sp="${J(p)}" data-sdef="${def}" title="Agrandir">+</button></span>`:'';
const lkBtn=p=>EDIT?`<button class="lk" data-link="${J(p)}" title="Changer la destination du lien">🔗</button>`:'';
function linkItem(lp,i,m,cls=''){const p=[...lp,i];
 if(!EDIT) return `<a${cls?` class="${cls}"`:''} href="${esc(href(m.cible))}">${esc(m.libelle)}</a>`;
 return `<a class="${cls} ei" href="${esc(href(m.cible))}"><span${ed([...p,'libelle'])}>${esc(m.libelle)}</span>${lkBtn(p)}${itools(lp,i)}</a>`;}
function btnObj(m,p,cls){if(!m)return '';
 if(!EDIT) return `<a class="${cls}" href="${esc(href(m.cible))}">${esc(m.libelle)}</a>`;
 return `<span class="${cls} elink"><span${ed([...p,'libelle'])}>${esc(m.libelle)}</span>${lkBtn(p)}</span>`;}
const btnLink=(C,p,cls)=>btnObj(get(C,p),p,cls);
function header(C){const S=C.site;return `<header class="top"><div class="wrap">
 ${EDIT?`<span class="ei logo-w"><img class="logo" src="img/logo-edm.png" alt="École du Design des Mutations" style="height:${S.logo_hauteur||34}px">${szb(['site','logo_hauteur'],34)}</span>`:`<a href="${esc(href('accueil'))}"><img class="logo" src="img/logo-edm.png" alt="École du Design des Mutations" style="height:${S.logo_hauteur||34}px"></a>`}
 <nav>${S.menu.map((m,i)=>linkItem(['site','menu'],i,m)).join('')}${addBtn(['site','menu'],{libelle:'Nouveau lien',cible:'accueil'},'+')}</nav>
 <div class="navcta">${S.boutons.map((m,i)=>linkItem(['site','boutons'],i,m)).join('')}${addBtn(['site','boutons'],{libelle:'Bouton',cible:'accueil'},'+')}</div></div></header>`;}
function footer(C){const L=(c,t)=>`<a href="${esc(href(c))}">${t}</a>`;const hp=sl=>(C.pages||[]).some(p=>p.slug===sl);const PG=(sl,alt)=>hp(sl)?'page-'+sl:alt;return `<footer class="foot2"><div class="fwrap">
 <div class="flogo"><img src="img/logo-edm.png" alt="École du Design des Mutations"></div>
 <div class="fnav"><h4>Navigation</h4><div class="fcols">
  <div>${L('page-ecole','<b>École</b>')}${L('page-ecole--pedagogie','Approche pédagogique')}${L('page-ecole--equipe','Équipe')}${L('page-ecole--intervenants','Intervenants')}${L('page-ecole--engagements','Engagements')}${L('page-ecole--engagements','<i>Accessibilité et handicap</i>')}${L('page-ecole--indicateurs','Résultats et indicateurs de performance')}</div>
  <div>${L('master-cime','<b>Communication &amp; innovation</b>')}<small><i>Spécialisation</i> Communication, Innovation, Médiation, Études</small>${L('master-tnr','<b>Transition numérique</b>')}<small><i>Spécialisation</i> Transition numérique responsable &amp; codesign</small></div>
  <div>${L('page-vie-des-masters','<b>Vie des masters</b>')}${L('page-vie-des-masters','Suivi &amp; coaching')}${L('page-vie-des-masters','Enseignement')}${L('page-vie-des-masters','Événements')}${L('page-vie-des-masters','Autogestion')}${L(PG('candidater','section-etapes'),'<b>Candidater</b>')}${L(PG('contact','section-contact'),'<b>Contact</b>')}</div></div></div>
 <div class="fct"><h4>Contact</h4><p><a class="u" href="mailto:${esc(C.site.email)}"${ed(['site','email'])}>${esc(C.site.email)}</a> <a class="lin" href="${esc(C.site.linkedin)}" aria-label="LinkedIn">in</a></p><p class="copy">©${new Date().getFullYear()} École du Design des Mutations. Tous droits réservés.</p><p class="legal"><a class="u" href="${esc(href(PG('mentions-legales','accueil')))}">Mentions légales</a> - <a class="u" href="${esc(href(PG('conditions-utilisation','accueil')))}">Conditions d'utilisation</a> - <a class="u" href="${esc(href(PG('politique-de-confidentialite','accueil')))}">Confidentialité</a></p></div>
 </div></footer>`;}

/* --- sections fixes de l'accueil (calquées sur la mise en page Wix) --- */
const FIXED={
 duo:{label:'Les deux masters',r:C=>`<div class="duo">${C.masters.map((m,i)=>`<div class="duo-p duo-${i}"><img class="duo-ill" src="${esc(m.illustration||('img/'+(m.slug==='cime'?'ill-cime':'ill-tnr')+'.svg'))}" alt=""${EDIT?` data-imgp="${J(['masters',i,'illustration'])}" title="Cliquer pour changer l'illustration"`:''}><h2>Master<br><span${ed(['masters',i,'titre'])}>${esc(m.titre)}</span></h2><p class="duo-acc"${ed(['masters',i,'accroche'],1)}>${esc(m.accroche)}</p>${EDIT?`<span class="fbtn ${i?'coral':'blue'}">En savoir plus</span>`:`<a class="fbtn ${i?'coral':'blue'}" href="${esc(href('master-'+m.slug))}">En savoir plus</a>`}</div>`).join('')}</div>`},
 alternance:{label:'Alternance',r:C=>`<section class="alt-sec"><div class="alt-grid"><div class="alt-card"><img class="dots" src="img/dots.png" alt="">${txt(C,['accueil','alternance_titre'],'h2','')}${par(C,['accueil','alternance_texte'])}${btnLink(C,['accueil','liens','alternance'],'fbtn blue nocap')}</div>${img(C,['accueil','alternance_image'],'img/promo-cime.jpg','Promotion de l\'EDM devant le CNAM',' class="alt-img"')}</div></section>`},
 temoignage:{label:'Témoignages',r:C=>{const T=C.temoignages||[];
   if(!T.length)return EDIT?`<section class="quote-sec"><div class="wrap">${addBtn(['temoignages'],{nom:'Prénom Nom, programme',programme:'',citation:'Citation',lien:''},'+ Ajouter un témoignage')}</div></section>`:'';
   return `<section class="quote-sec"><div class="qcar" data-n="${T.length}">${T.length>1?'<button class="qarr qprev" data-tq="-1" aria-label="Témoignage précédent">‹</button><button class="qarr qnext" data-tq="1" aria-label="Témoignage suivant">›</button>':''}
   ${T.map((t,i)=>`<div class="qslide${i?'':' on'}"><p class="qname"><span${ed(['temoignages',i,'nom'])}>${esc(t.nom)}</span>${t.programme||EDIT?`, <span${ed(['temoignages',i,'programme'])}>${esc(t.programme)}</span>`:''}</p><span class="qline"></span><blockquote>« <span${ed(['temoignages',i,'citation'],1)}>${esc(t.citation)}</span> »</blockquote>${t.lien&&!EDIT?`<a class="qlink" href="${esc(t.lien)}">Voir la publication complète</a>`:''}${EDIT?`<div class="qtools"><span class="qurl">Lien de la publication : <span${ed(['temoignages',i,'lien'])}>${esc(t.lien||'')}</span></span><button class="eadd" data-li="del" data-p="${J(['temoignages'])}" data-i="${i}">Supprimer ce témoignage</button></div>`:''}</div>`).join('')}
   ${T.length>1?`<div class="qdots">${T.map((t,i)=>`<button data-tqi="${i}" class="${i?'':'on'}" aria-label="Témoignage ${i+1}"></button>`).join('')}</div>`:''}
   ${addBtn(['temoignages'],{nom:'Prénom Nom',programme:'Programme',citation:'Citation',lien:''},'+ Ajouter un témoignage')}</div></section>`;}},
 programmes:{label:'Programmes',r:C=>`<section class="prog-sec"><div class="wrap center">${txt(C,['accueil','programmes_titre'],'h2','ptitle')}${par(C,['accueil','programmes_texte'],'prose plead')}</div>
  <div class="progs">${[...C.masters].sort((a,b)=>a.slug==='cime'?-1:1).map(m=>{const mi=C.masters.indexOf(m);const M=k=>['masters',mi,k];
   return `<div class="prog-b">${img(C,M('prog_image'),m.slug==='cime'?'img/prog-cime.jpg':'img/prog-tnr.jpg','',' class="prog-img"')}<div class="prog-card" data-tabs><div class="ptabs"><button class="on" data-tab="0">Vue d'ensemble</button><button data-tab="1">Année 1</button><button data-tab="2">Année 2</button></div>
    <div class="ptab on"><h3><b>Master</b> <span${ed(M('titre'))}>${esc(m.titre)}</span></h3><p${ed(M('resume'),1)}>${esc(m.resume)}</p></div>
    <div class="ptab">${par(C,M('annee1'),'prose ptxt')}</div><div class="ptab">${par(C,M('annee2'),'prose ptxt')}</div>
    ${EDIT?'<span class="plink">Voir le détail du programme</span>':`<a class="plink" href="${esc(href('master-'+m.slug))}">Voir le détail du programme</a>`}</div></div>`;}).join('')}</div></section>`},
 etapes:{label:'Étapes d\'admission',r:C=>{const A=C.accueil;const imgs=A.etapes_images||[];
  return `<section class="steps-sec"><div class="wrap"><div class="steps-head"><h2>Rejoindre un master<br>en ${A.etapes.length} étapes</h2>${A.etapes_points==='non'?(EDIT?`<button class="eadd" data-pts="on">+ Points décoratifs</button>`:''):`<span class="steps-dots ei"><img src="img/dots.png" alt="">${EDIT?`<span class="itools" contenteditable="false"><button data-pts="off" title="Supprimer les points">✕</button></span>`:''}</span>`}</div>
  <div class="steps2">${A.etapes.map((e,i)=>`<div class="step ei"><div class="circ">${EDIT?`<img src="${esc(imgs[i]||'img/etape'+(i%4+1)+'.jpg')}" alt="" data-imgp="${J(['accueil','etapes_images',i])}">`:`<img src="${esc(imgs[i]||'img/etape'+(i%4+1)+'.jpg')}" alt="">`}<span>${i+1}</span></div><p${ed(['accueil','etapes',i])}>${esc(e)}</p>${itools(['accueil','etapes'],i)}</div>`).join('')}</div>${addBtn(['accueil','etapes'],'Nouvelle étape','+ Ajouter une étape')}
  <div class="tline"><span class="tl-mid"${ed(['accueil','periode1'])}>${esc(A.periode1||'Mars - juin')}</span><span class="tl-end"${ed(['accueil','periode2'])}>${esc(A.periode2||'Octobre')}</span></div>
  <div class="tq"><b>Des questions ?</b><br>Participez à l'une de nos <b>réunions d'information</b><br>${(C.reunions||[]).map((r,i)=>`<i class="ei">(<span${ed(['reunions',i,'date'])}>${esc(r.date)}</span> - <span${ed(['reunions',i,'horaire'])}>${esc(r.horaire)}</span>${r.lieu||EDIT?`, <span${ed(['reunions',i,'lieu'])}>${esc(r.lieu)}</span>`:''})${itools(['reunions'],i)}</i>`).join('<br>')}${addBtn(['reunions'],{date:'Date',horaire:'horaire',lieu:''},'+ Ajouter une réunion')}</div></div></section>`;}},
 reunions:{label:'Réunions d\'information (bandeau)',r:C=>`<section class="blk dark"><div class="wrap"><h2 class="big">Des questions ?</h2><p>Participez à l'une de nos réunions d'information.</p><div class="meetings">${C.reunions.map((r,i)=>`<div class="ei"><b${ed(['reunions',i,'date'])}>${esc(r.date)}</b><span${ed(['reunions',i,'horaire'])}>${esc(r.horaire)}</span><span${ed(['reunions',i,'lieu'])}>${esc(r.lieu)}</span>${itools(['reunions'],i)}</div>`).join('')||(EDIT?'':'<div>Dates à venir</div>')}</div>${addBtn(['reunions'],{date:'Date',horaire:'Horaire',lieu:'Lieu ou lien'},'+ Ajouter une réunion')}</div></section>`},
 pourquoi:{label:'Pourquoi l\'EDM',r:C=>`<section class="why-sec"><div class="why">${img(C,['accueil','pourquoi_image'],'img/cours.jpg','Atelier de codesign',' class="why-img"')}<div class="why-card">${txt(C,['accueil','pourquoi_titre'],'h2','')}${par(C,['accueil','pourquoi_texte'])}${btnLink(C,['accueil','liens','pourquoi'],'fbtn coral')}</div></div></section>`},
 vie:{label:'Vie des masters',r:C=>{const G=C.accueil.vie_galerie||[];
  return `<section class="life-sec"><div class="wrap">${txt(C,['accueil','vie_titre'],'h2','ltitle')}<div class="life"><div class="lgal" data-gal="0">${G.length?`<div class="lmain"><img src="${esc(G[0])}" alt=""${EDIT?` data-imgp="${J(['accueil','vie_galerie',0])}"`:''}>${G.length>1&&!EDIT?'<button class="lnext" data-gnext aria-label="Image suivante">›</button>':''}</div>`:''}<div class="lthumbs">${G.map((g,i)=>`<span class="ei"><img src="${esc(g)}" alt="" data-gi="${i}"${EDIT?` data-imgp="${J(['accueil','vie_galerie',i])}"`:''}>${itools(['accueil','vie_galerie'],i)}</span>`).join('')}</div>${addBtn(['accueil','vie_galerie'],'img/vie-2.jpg','+ Ajouter une photo')}</div>
  <div class="ltext">${par(C,['accueil','vie_texte'])}${btnLink(C,['accueil','liens','vie'],'fbtn coral')}</div></div></div></section>`;}},
 handicap:{label:'Handicap',r:C=>`<section class="hc-sec"><div class="wrap hc">${txt(C,['accueil','handicap_titre'],'h2','')}<div>${par(C,['accueil','handicap_texte'])}<a class="ulink" href="https://handi.cnam.fr">À propos de la mission Handi-CNAM</a></div></div></section>`},
 contact:{label:'Formulaire de contact',r:C=>`<section class="ct-sec" id="contact"><div class="wrap ct"><div><h2>Nous contacter</h2><p>Remplissez le formulaire ci-contre et nous vous répondrons dans les plus brefs délais.</p></div>
  <form class="ctf" data-contact="1">
   <label>Prénom *<input name="prenom" required></label><label>Nom de famille<input name="nom"></label>
   <label class="full">E-mail *<input name="email" type="email" required></label>
   <fieldset class="full"><legend>Je suis... *</legend>${['Étudiant.e','Recruteur','Intervenant.e','Autre'].map((o,i)=>`<label class="chip"><input type="radio" name="profil" value="${o}" ${i?'':'required'}><span>${o}</span></label>`).join('')}</fieldset>
   <label class="full">Message *<textarea name="message" required></textarea></label>
   <div class="full"><button class="pill">Envoyer</button></div></form></div></section>`}
};
const DEFAULT_ORDER=['duo','alternance','temoignage','programmes','etapes','pourquoi','vie','handicap','contact'];
const sectionsOf=C=>C.accueil.sections||DEFAULT_ORDER.map(id=>({type:'fixe',id}));

/* --- bibliothèque de sections --- */
const LIB={
 'texte':{label:'Texte',desc:'Un titre et un ou plusieurs paragraphes.',def:{titre:'Titre de la section',texte:'Cliquez ici pour écrire votre texte.\n\nAppuyez deux fois sur Entrée pour créer un nouveau paragraphe.'},
  r:(s,p)=>`<section class="blk"><div class="wrap" style="max-width:860px"><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><div class="prose"${edr([...p,'texte'])}>${paras(s.texte)}</div></div></section>`},
 'tuiles':{label:'Tuiles',desc:'Des tuiles colorées avec image, titre et texte détaillé à déplier.',def:{items:[{etiquette:'Étiquette',titre:'Titre de la tuile',texte:'INTERTITRE\n\nTexte détaillé affiché quand on déplie la tuile.',image:'img/vie-coaching.jpg',couleur:'navy'},{etiquette:'Étiquette',titre:'Titre de la tuile',texte:'Texte détaillé.',image:'img/vie-evenements.jpg',couleur:'coral'}]},
  r:(s,p)=>`<section class="blk tiles-sec"><div class="wrap"><div class="tiles">${s.items.map((t,i)=>{const q=[...p,'items',i];return `<div class="tile ei c-${esc(t.couleur||'navy')}"><div class="tile-top"><div class="tile-panel"><small${ed([...q,'etiquette'])}>${esc(t.etiquette)}</small><h3${ed([...q,'titre'])}>${esc(t.titre)}</h3><span class="dots"></span></div><img src="${esc(t.image)}" alt=""${EDIT?` data-imgp="${J([...q,'image'])}"`:''}></div>
   <details class="tile-more"${EDIT?' open':''}><summary>En savoir plus</summary><div class="prose"${edr([...q,'texte'])}>${rich(t.texte)}</div></details>
   ${EDIT?`<div class="tile-colors">Couleur : ${['navy','coral','slate','blue'].map(c=>`<button class="sw c-${c}${(t.couleur||'navy')===c?' on':''}" data-color="${J([...q,'couleur'])}" data-c="${c}" title="${c}"></button>`).join('')}</div>`:''}${itools([...p,'items'],i)}</div>`;}).join('')}</div>${addBtn([...p,'items'],{etiquette:'Étiquette',titre:'Nouvelle tuile',texte:'Texte détaillé.',image:'img/vie-2.jpg',couleur:'blue'},'+ Ajouter une tuile')}</div></section>`},
 'galerie':{label:'Images',desc:'Une ou plusieurs images avec légende, en grille.',def:{titre:'',items:[{image:'img/vie-1.jpg',legende:'Légende de l\'image'},{image:'img/vie-2.jpg',legende:'Légende de l\'image'}]},
  r:(s,p)=>`<section class="blk"><div class="wrap">${s.titre||EDIT?`<h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2>`:''}<div class="gal g${Math.min(s.items.length,3)}">${s.items.map((g,i)=>`<figure class="ei"><img src="${esc(g.image)}" alt="${esc(g.legende)}"${EDIT?` data-imgp="${J([...p,'items',i,'image'])}"`:''}>${g.legende||EDIT?`<figcaption${ed([...p,'items',i,'legende'])}>${esc(g.legende)}</figcaption>`:''}${itools([...p,'items'],i)}</figure>`).join('')}</div>${addBtn([...p,'items'],{image:'img/vie-2.jpg',legende:''},'+ Ajouter une image')}</div></section>`},
 'sommaire':{label:'Sommaire',desc:'Une barre de liens vers les sections de la page.',def:{items:[{libelle:'Section 1',cible:'accueil'},{libelle:'Section 2',cible:'accueil'}]},
  r:(s,p)=>`<nav class="sommaire"><div class="wrap">${s.items.map((m,i)=>linkItem([...p,'items'],i,m,'som')).join('')}${addBtn([...p,'items'],{libelle:'Nouveau lien',cible:'accueil'},'+')}</div></nav>`},
 'equipe':{label:'Équipe',desc:'Des personnes avec photo, nom, rôle et contact.',def:{titre:'Équipe',items:[{nom:'Prénom Nom',role:'Rôle',email:'',photo:''}]},
  r:(s,p)=>`<section class="blk team-sec"><div class="wrap"><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><div class="team">${s.items.map((m,i)=>{const q=[...p,'items',i];const ini=(m.nom||'?').split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
   return `<div class="person ei">${m.photo?`<img class="ph" src="${esc(m.photo)}" alt="${esc(m.nom)}"${EDIT?` data-imgp="${J([...q,'photo'])}"`:''}>`:`<div class="ph ini"${EDIT?` data-imgp="${J([...q,'photo'])}" title="Ajouter une photo"`:''}>${esc(ini)}</div>`}<b${ed([...q,'nom'])}>${esc(m.nom)}</b><span${ed([...q,'role'],1)}>${esc(m.role)}</span>${m.email||EDIT?`<a class="mail"${EDIT?'':` href="mailto:${esc(m.email)}"`}${ed([...q,'email'])}>${esc(m.email)}</a>`:''}${itools([...p,'items'],i)}</div>`;}).join('')}</div>${addBtn([...p,'items'],{nom:'Prénom Nom',role:'Rôle',email:'',photo:''},'+ Ajouter une personne')}</div></section>`},
 'texte-image':{label:'Texte et image',desc:'Un titre et un texte à côté d\'une photo.',def:{titre:'Nouveau titre',texte:'Cliquez ici pour écrire votre texte.',image:'img/vie-2.jpg',inverse:''},
  r:(s,p)=>{const im=`<img src="${esc(s.image)}" alt=""${EDIT?` data-imgp="${J([...p,'image'])}"`:''}>`;const tx=`<div><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><div class="prose"${edr([...p,'texte'])}>${paras(s.texte)}</div></div>`;
   return `<section class="blk"><div class="wrap split${s.inverse?' rev':''}">${s.inverse?im+tx:tx+im}</div>${EDIT?`<div class="wrap"><button class="eadd" data-flip="${J([...p,'inverse'])}">⇄ Inverser texte et image</button></div>`:''}</section>`;}},
 'chiffres':{label:'Chiffres clés',desc:'Trois ou quatre chiffres mis en avant sur fond bleu.',def:{titre:'L\'EDM en chiffres',items:[{valeur:'25',libelle:'étudiants environ par promotion'},{valeur:'2',libelle:'masters en alternance'},{valeur:'8',libelle:'blocs de compétences RNCP'}]},
  r:(s,p)=>`<section class="blk dark"><div class="wrap"><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><div class="kpis">${s.items.map((k,i)=>`<div class="ei"><b${ed([...p,'items',i,'valeur'])}>${esc(k.valeur)}</b><span${ed([...p,'items',i,'libelle'])}>${esc(k.libelle)}</span>${itools([...p,'items'],i)}</div>`).join('')}</div>${addBtn([...p,'items'],{valeur:'0',libelle:'Libellé'},'+ Ajouter un chiffre')}</div></section>`},
 'cartes':{label:'Cartes',desc:'Une série de cartes avec titre et texte (atouts, services, partenaires).',def:{titre:'Titre de la section',items:[{titre:'Première carte',texte:'Texte de la carte.'},{titre:'Deuxième carte',texte:'Texte de la carte.'},{titre:'Troisième carte',texte:'Texte de la carte.'}]},
  r:(s,p)=>`<section class="blk alt"><div class="wrap"><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><div class="cards">${s.items.map((c,i)=>`<div class="card ei"><h3${ed([...p,'items',i,'titre'])}>${esc(c.titre)}</h3><div class="prose"${edr([...p,'items',i,'texte'])}>${paras(c.texte)}</div>${itools([...p,'items'],i)}</div>`).join('')}</div>${addBtn([...p,'items'],{titre:'Nouvelle carte',texte:'Texte de la carte.'},'+ Ajouter une carte')}</div></section>`},
 'citation':{label:'Citation',desc:'Une citation mise en valeur avec son auteur.',def:{citation:'Votre citation ici',auteur:'Prénom Nom, fonction'},
  r:(s,p)=>`<section class="blk alt"><div class="wrap"><div class="quote"><blockquote>« <span${ed([...p,'citation'],1)}>${esc(s.citation)}</span> »</blockquote><cite${ed([...p,'auteur'])}>${esc(s.auteur)}</cite></div></div></section>`},
 'linkedin':{label:'LinkedIn',desc:'Les pages LinkedIn de l\'école ou des masters et une sélection de publications.',def:{titre:'Suivez-nous sur LinkedIn',texte:'Actualités des promotions, événements et témoignages d\'alternants.',pages:[{libelle:'Page de l\'EDM',cible:'https://www.linkedin.com/company/ecole-du-design-des-mutations/'}],posts:[{auteur:'Clara Hoffman, M2 Transition Numérique Responsable',date:'',texte:'Si vous cherchez un master pour vous lancer dans le management de projet avec des outils de collaboration innovants, je vous recommande vivement ce master.',cible:'https://www.linkedin.com/company/ecole-du-design-des-mutations/'}]},
  r:(s,p)=>`<section class="blk li-sec"><div class="wrap"><div class="li-head"><div><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><p${ed([...p,'texte'],1)}>${esc(s.texte)}</p></div><div class="li-pages">${(s.pages||[]).map((pg,i)=>EDIT?`<span class="li-page ei"><span class="li-mark">in</span><span${ed([...p,'pages',i,'libelle'])}>${esc(pg.libelle)}</span>${lkBtn([...p,'pages',i])}${itools([...p,'pages'],i)}</span>`:`<a class="li-page" href="${esc(href(pg.cible))}"><span class="li-mark">in</span>${esc(pg.libelle)}</a>`).join('')}${addBtn([...p,'pages'],{libelle:'Page du master',cible:'https://www.linkedin.com/'},'+ Ajouter une page')}</div></div>
   ${s.widget?`<div class="li-feed"><iframe src="${esc(s.widget)}" title="Publications LinkedIn" loading="lazy" frameborder="0" width="100%" height="900"></iframe></div>`:''}${EDIT?`<div class="li-widget"><b>Fil LinkedIn automatique (SociableKit)</b><span>Adresse du widget : <span class="li-url"${ed([...p,'widget'])}>${esc(s.widget||'')}</span></span><small>${s.widget?'Les publications ci-dessous ne s\'affichent pas sur le site tant qu\'un fil automatique est configuré.':'Aucun fil configuré : les publications ci-dessous sont affichées.'}</small></div>`:''}
   ${s.widget&&!EDIT?'':`<div class="cards li-posts">`}${(s.widget&&!EDIT?[]:(s.posts||[])).map((po,i)=>`<div class="card li-post ei"><div class="li-top"><span class="li-mark">in</span><div><b${ed([...p,'posts',i,'auteur'])}>${esc(po.auteur)}</b><small${ed([...p,'posts',i,'date'])}>${esc(po.date)}</small></div></div><p${ed([...p,'posts',i,'texte'],1)}>${esc(po.texte)}</p>${EDIT?`<span class="li-more">Voir la publication ${lkBtn([...p,'posts',i])}</span>`:`<a class="li-more" href="${esc(href(po.cible))}">Voir la publication →</a>`}${itools([...p,'posts'],i)}</div>`).join('')}${s.widget&&!EDIT?'':'</div>'}${addBtn([...p,'posts'],{auteur:'Auteur',date:'',texte:'Extrait de la publication.',cible:'https://www.linkedin.com/'},'+ Ajouter une publication')}</div></section>`},
 'bandeau':{label:'Bandeau d\'appel',desc:'Un message court avec un bouton (candidatures, événement).',def:{titre:'Candidatures ouvertes',texte:'Déposez votre dossier de mars à juin pour une rentrée en octobre.',lien:{libelle:'Candidater',cible:'section-etapes'}},
  r:(s,p)=>`<section class="blk cta"><div class="wrap"><div><h2 class="big"${ed([...p,'titre'])}>${esc(s.titre)}</h2><p${ed([...p,'texte'],1)}>${esc(s.texte)}</p></div>${btnObj(s.lien,[...p,'lien'],'btn light')}</div></section>`}
};

function renderSections(C,secs,sp){
 const ins=i=>EDIT?`<div class="inserter"><button data-ins="${i}" data-sp="${J(sp)}">+ Ajouter une section ici</button></div>`:'';
 const body=secs.map((s,i)=>{
  const p=[...sp,i];
  const label=s.type==='fixe'?FIXED[s.id]?.label:LIB[s.type]?.label;
  let html='';
  if(!s.masque) html=s.type==='fixe'?(FIXED[s.id]?FIXED[s.id].r(C):''):(LIB[s.type]?LIB[s.type].r(s,p):'');
  const lay=s.type!=='fixe'?((s.align?' al-'+s.align:'')+(s.largeur?' w-'+s.largeur:'')+(s.fond?' bg-'+s.fond:'')+(s.encadre?' boxed':'')):'';
  if(html) html=`<div id="s-${esc(s.type==='fixe'?s.id:s.id||('bloc'+i))}"${lay?` class="${lay.trim()}"`:''}>${html}</div>`;
  if(!EDIT) return html;
  const d=`data-si="${i}" data-sp="${J(sp)}"`;
  const AL={'':'Aligné à gauche',center:'Centré',right:'Aligné à droite'},WL={'':'Largeur normale',etroit:'Étroit',large:'Large'};
  const FL={'':'Fond blanc',gris:'Fond gris',bleu:'Fond bleu marine',corail:'Fond corail clair'};
  const lay2=s.type!=='fixe'?`<button data-sec="fond" ${d} title="${FL[s.fond||'']} : cliquer pour changer">Fond</button><button data-sec="encadre" ${d} title="${s.encadre?'Encadré : oui':'Encadré : non'} (cliquer pour changer)">${s.encadre?'▣':'□'}</button><button data-sec="align" ${d} title="${AL[s.align||'']} : cliquer pour changer">${s.align==='center'?'↔':s.align==='right'?'⇥':'⇤'}</button><button data-sec="width" ${d} title="${WL[s.largeur||'']} : cliquer pour changer">${s.largeur==='etroit'?'▯':s.largeur==='large'?'▭▭':'▭'}</button>`:'';
  const tools=`<div class="stools"><button class="sdrag" data-secdrag="1" ${d} title="Glisser pour déplacer la section">⠿ Déplacer</button><span>${esc(label||'Section')}</span>${lay2}<button data-sec="up" ${d} title="Monter">↑</button><button data-sec="down" ${d} title="Descendre">↓</button>${s.type==='fixe'?`<button data-sec="${s.masque?'show':'hide'}" ${d}>${s.masque?'Afficher':'Masquer'}</button>`:`<button data-sec="del" ${d}>Supprimer</button>`}</div>`;
  return `<div class="esec${s.masque?' masked':''}" ${d}>${tools}${s.masque?`<div class="maskedbar">Section masquée : ${esc(label)}</div>`:html}</div>`+ins(i+1);
 }).join('');
 return ins(0)+body+(EDIT&&!secs.length?'<div class="wrap empty-hint" style="margin:40px auto">Cette page est vide : utilisez « + Ajouter une section ici » pour la remplir.</div>':'');
}
function pageCustom(C,pg){
 if(!pg) return header(C)+'<div class="wrap" style="padding:80px 24px">Page introuvable.</div>'+footer(C);
 const pi=C.pages.indexOf(pg);
 return header(C)+`<section class="mhero"><div class="wrap"><h1${ed(['pages',pi,'titre'])}>${esc(pg.titre)}</h1>${pg.chapo_titre||EDIT?`<h2 class="ctitle"${ed(['pages',pi,'chapo_titre'])}>${esc(pg.chapo_titre||'')}</h2>`:''}<p class="rncp chapo"${ed(['pages',pi,'chapo'],1)}>${esc(pg.chapo)}</p></div></section>`+renderSections(C,pg.sections,['pages',pi,'sections'])+footer(C);
}
const DECO_DEF=[];// flèches décoratives retirées à la demande (24 nov. 2026)
function pageAccueil(C){
 const secs=sectionsOf(C);
 const hero=`<section class="hero"><div class="wrap">
  <p class="pre"${ed(['site','accroche_titre'])}>${esc(C.site.accroche_titre)}</p><h1${ed(['site','titre'])}>${esc(C.site.titre)}</h1>
  <div class="row"><p class="slogan"${ed(['site','slogan'],1)}>${esc(C.site.slogan).replace(/\n/g,'<br>')}</p>
  ${(C.site.deco||DECO_DEF).map((d,i)=>`<img class="deco${EDIT?' deco-ed':''}" src="${esc(d.src)}" alt="" draggable="false" style="left:${+d.x||0}px;bottom:${+d.y||0}px;width:${+d.w||90}px;transform:${d.flip?'scaleX(-1) ':''}rotate(${+d.rot||0}deg)"${EDIT?` data-deco="${i}" title="Glisser pour déplacer ; cliquer pour les réglages"`:''}>`).join('')}
  <div class="partner"><span${ed(['site','partenaire_texte'])}>${esc(C.site.partenaire_texte)}</span><div class="plogos">${C.site.partenaires.map((pt,i)=>EDIT?`<span class="ei plogo"><img src="${esc(pt.logo)}" alt="${esc(pt.nom)}" style="height:${pt.hauteur||28}px" data-imgp="${J(['site','partenaires',i,'logo'])}" data-logos="1" title="Cliquer pour changer le logo">${lkBtn(['site','partenaires',i])}${itools(['site','partenaires'],i)}${szb(['site','partenaires',i,'hauteur'],28)}</span>`:`<a href="${esc(href(pt.cible))}"><img src="${esc(pt.logo)}" alt="${esc(pt.nom)}" style="height:${pt.hauteur||28}px"></a>`).join('')}${addBtn(['site','partenaires'],{nom:'Partenaire',logo:'img/logo-cnam.png',cible:'https://'},'+ Partenaire')}</div></div></div></div></section>`;
 return header(C)+hero+renderSections(C,secs,['accueil','sections'])+footer(C);
}

function pageMaster(C,m){
 if(!m) return header(C)+'<div class="wrap" style="padding:80px 24px">Page introuvable.</div>'+footer(C);
 const mi=C.masters.indexOf(m),M=k=>['masters',mi,k],K=C.communs;
 const dd=(l,k,para)=>`<dt>${l}</dt><dd${ed(M(k),para)}>${esc(m[k]).replace(/\n/g,'<br>')}</dd>`;
 return header(C)+`
 <section class="mhero"><div class="wrap"><span class="eyebrow"${ed(M('surtitre'))}>${esc(m.surtitre)}</span><h1>Master<small><span${ed(M('titre'))}>${esc(m.titre)}</span> (<span${ed(M('sigle'))}>${esc(m.sigle)}</span>)</small></h1><p class="rncp"${ed(['site','rncp'],1)}>${esc(C.site.rncp)}</p></div></section>
 <section class="blk"><div class="wrap"><p class="lead"${ed(M('intro'),1)}>${esc(m.intro)}</p></div></section>
 <section class="blk alt" style="padding-top:56px"><div class="wrap split" style="align-items:start"><div><h2 class="big"${ed(M('accroche'))}>${esc(m.accroche)}</h2>${par(C,M('description'))}</div>${img(C,M('image'),'img/cours.jpg')}</div></section>
 <section class="blk"><div class="wrap"><h2 class="big">Compétences principales</h2><div class="comp">${m.competences.map((c,i)=>`<div class="ei"><span${ed([...M('competences'),i])}>${esc(c)}</span>${itools(M('competences'),i)}</div>`).join('')}</div>${addBtn(M('competences'),'Nouvelle compétence','+ Ajouter une compétence')}</div></section>
 <section class="blk alt"><div class="wrap split" style="align-items:start"><div class="infobox"><h3>Informations pratiques</h3><dl>
  <dt>Format</dt><dd>Alternance</dd>${dd('Durée','duree')}${dd('Rythme','rythme',1)}${dd('Campus','campus')}${dd('Prérequis','prerequis')}${dd('Rentrée','rentree')}${dd('Rendus et soutenances','soutenances',1)}${dd('Responsables','responsables')}</dl></div>
  <div><h2 class="big">Prêt·e à te lancer ?</h2><p>Vous souhaitez en savoir plus ? Prenez contact avec l'équipe pédagogique.</p>${btnLink(C,['communs','liens','candidature'],'btn coral')} ${btnLink(C,['communs','liens','contact'],'btn')}</div></div></section>
 <section class="blk"><div class="wrap"><div class="cards">${K.atouts.map((a,i)=>`<div class="card ei"><h3${ed(['communs','atouts',i,'titre'])}>${esc(a.titre)}</h3>${par(C,['communs','atouts',i,'texte'])}${itools(['communs','atouts'],i)}</div>`).join('')}</div>${addBtn(['communs','atouts'],{titre:'Nouvel atout',texte:'Texte'},'+ Ajouter un atout')}${EDIT?'<p class="ehint">Ces trois blocs sont communs aux deux masters : les modifier ici les modifie aussi sur l\'autre page.</p>':''}</div></section>
 <section class="blk alt"><div class="wrap"><h2 class="big">Carrières et débouchés</h2><p>Chaque année, nous ajustons nos programmes pour rester au plus proche des attentes des entreprises, et anticiper les mutations des métiers.</p>
  <div class="cards">${m.carrieres.map((c,i)=>`<div class="card career ei"><h3${ed([...M('carrieres'),i,'titre'])}>${esc(c.titre)}</h3><p${ed([...M('carrieres'),i,'mission'],1)}>${esc(c.mission)}</p>${c.postes||EDIT?`<div class="postes"><b>Postes types :</b> <span${ed([...M('carrieres'),i,'postes'])}>${esc(c.postes)}</span></div>`:''}${itools(M('carrieres'),i)}</div>`).join('')}</div>${addBtn(M('carrieres'),{titre:'Nouveau métier',mission:'Mission',postes:''},'+ Ajouter un métier')}</div></section>
 <section class="blk"><div class="wrap" style="max-width:860px"><h2 class="big"${ed(['communs','gratuite_titre'])}>${esc(K.gratuite_titre)}</h2>${par(C,['communs','gratuite_texte'])}</div></section>
 <section class="blk dark"><div class="wrap"><h2 class="big">Résultats et indicateurs</h2><div class="kpis">${m.indicateurs.map((k,i)=>`<div class="ei"><b${ed([...M('indicateurs'),i,'valeur'])}>${esc(k.valeur)}</b><span${ed([...M('indicateurs'),i,'libelle'])}>${esc(k.libelle)}</span>${itools(M('indicateurs'),i)}</div>`).join('')}</div>${addBtn(M('indicateurs'),{valeur:'0%',libelle:'Libellé'},'+ Ajouter un indicateur')}<p style="opacity:.85;font-size:14px"${ed(M('indicateurs_note'),1)}>${esc(m.indicateurs_note)}</p></div></section>
 <section class="blk"><div class="wrap">${(m.blocs_intro||EDIT)?`<h2 class="big">Compétences et évaluation</h2><div class="blocs-intro">${par(C,[...M('blocs_intro')])}</div>`:''}<h2 class="big">Blocs de compétences</h2>${m.blocs.map((b,i)=>`<details class="bloc ei"${EDIT?' open':''}><summary><span>${String(i+1).padStart(2,'0')}</span><span class="bt"${ed([...M('blocs'),i,'titre'])}>${esc(b.titre)}</span></summary><div class="inner"><p><b${ed([...M('blocs'),i,'code'])}>${esc(b.code)}</b>${b.competences||EDIT?' :':''}</p>${EDIT?`<p class="bcomp-ed"${ed([...M('blocs'),i,'competences'],1)}>${esc(b.competences||'Une compétence par ligne').replace(/\n/g,'<br>')}</p>`:(b.competences?`<ul class="bcomp">${b.competences.split('\n').filter(x=>x.trim()).map(x=>`<li>${esc(x.replace(/^[-•]\s*/,''))}</li>`).join('')}</ul>`:'')}<p><b>Modules associés :</b><br><span${ed([...M('blocs'),i,'modules'],1)}>${esc(b.modules).replace(/\n/g,'<br>')}</span></p><p><b>Évaluation :</b> <span${ed([...M('blocs'),i,'evaluation'],1)}>${esc(b.evaluation)}</span></p></div>${itools(M('blocs'),i)}</details>`).join('')||(EDIT?'':'<div class="empty-hint">Les blocs de compétences de ce master n\'ont pas encore été saisis.</div>')}${addBtn(M('blocs'),{code:'RNCP38208BC0',titre:'Nouveau bloc',competences:'',modules:'Module',evaluation:'Modalités d\'évaluation'},'+ Ajouter un bloc de compétences')}</div></section>`+footer(C);
}

const IMG_V='2';// à incrémenter quand une image du thème change, pour forcer son rechargement
function renderPage(C,route){CURRENT_C=C;return renderPage0(C,route).replace(/(src|href)="img\/([^"?]+)"/g,(m,a,f)=>a+'="'+ASSET_BASE+'img/'+f+'?v='+IMG_V+'"');}
function renderPage0(C,route){
 if(route.startsWith('master-')) return pageMaster(C,C.masters.find(m=>'master-'+m.slug===route));
 if(route.startsWith('page-')){const sl=route.slice(5).split('--')[0];return pageCustom(C,C.pages.find(p=>p.slug===sl));}
 return pageAccueil(C);
}

/* ============ valeurs par défaut ============ */
function fillMissing(t,o){if(!t||!o||typeof o!=='object'||Array.isArray(o))return;for(const k in o){if(k==='pages'||k==='seeded')continue;if(t[k]===undefined)t[k]=clone(o[k]);else if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))fillMissing(t[k],o[k]);}
 if(Array.isArray(t.masters)&&Array.isArray(o.masters))t.masters.forEach(m=>{const om=o.masters.find(x=>x.slug===m.slug);if(om)for(const k in om)if(m[k]===undefined)m[k]=clone(om[k]);});}
let ORIGIN_RAW=null;
const stripMd=t=>String(t||'').replace(/\*\*|\*/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\s+/g,' ').trim();
function upgrade(C,O){
 for(const k in O.accueil){const v=O.accueil[k];if(typeof v==='string'&&typeof C.accueil[k]==='string'&&C.accueil[k]!==v&&stripMd(C.accueil[k])===stripMd(v))C.accueil[k]=v;}
 if(Array.isArray(C.temoignages)&&C.temoignages.length<O.temoignages.length&&C.temoignages.every(t=>O.temoignages.some(o=>o.nom===t.nom&&stripMd(o.citation)===stripMd(t.citation))))C.temoignages=clone(O.temoignages);
 if(Array.isArray(C.reunions)&&C.reunions.length===1&&C.reunions[0].date==="Début de l'été 2027")C.reunions=clone(O.reunions);
}
function norm(C){if(!C)return C;if(ORIGIN_RAW&&C!==ORIGIN_RAW){fillMissing(C,ORIGIN_RAW);upgrade(C,ORIGIN_RAW);}const S=C.site;
 S.menu??=[{libelle:"L'école",cible:'page-ecole'},{libelle:'Communication & innovation',cible:'master-cime'},{libelle:'Transition numérique',cible:'master-tnr'},{libelle:'Vie des masters',cible:'page-vie-des-masters'}];
 S.boutons??=[{libelle:'Candidater',cible:'section-etapes'},{libelle:'Contact',cible:'section-contact'}];
 S.partenaire_texte??='En partenariat avec';
 C.pages??=[];
 C.seeded??=C.pages.map(p=>p.slug);
 for(const op of ORIGIN_PAGES){if(!C.seeded.includes(op.slug)){if(!C.pages.some(p=>p.slug===op.slug)){C.pages.push(clone(op));const mi=S.menu.find(m=>m.libelle.trim().toLowerCase()===(op.menu||op.titre).toLowerCase());if(mi)mi.cible='page-'+op.slug;}C.seeded.push(op.slug);}}
 S.partenaires??=[{nom:'le Cnam',logo:'img/logo-cnam.png',cible:'https://www.cnam.fr'}];
 C.accueil.liens??={};const L=C.accueil.liens;
 L.alternance??={libelle:"À propos de l'EDM",cible:'section-pourquoi'};L.pourquoi??={libelle:'Nous rencontrer',cible:'section-reunions'};L.vie??={libelle:'En savoir plus',cible:'page-vie-des-masters'};
 C.communs.liens??={};const K=C.communs.liens;
 K.candidature??={libelle:'Dossier de candidature',cible:'section-etapes'};
 if(!C.accueil.sections){C.accueil.sections=DEFAULT_ORDER.map(id=>({type:'fixe',id}));}K.contact??={libelle:'Contact',cible:'section-contact'};
 // pages Candidater et Contact : les liens par défaut y renvoient désormais
 const hasP=sl=>C.pages.some(p=>p.slug===sl);const remap=m=>{if(!m)return;if(m.cible==='section-etapes'&&hasP('candidater'))m.cible='page-candidater';else if(m.cible==='section-contact'&&hasP('contact'))m.cible='page-contact';};
 S.boutons.forEach(remap);remap(K.candidature);remap(K.contact);
 return C;}
const LOGOS=['img/logo-cnam.png','img/logo-edm.png'];

/* ============ charte graphique (polices et couleurs) ============ */
const FONTS={titres:['Outfit','Montserrat','Poppins','Lexend','Raleway','Work Sans','DM Sans','Nunito Sans','Playfair Display','Merriweather'],texte:['Outfit','Inter','Nunito Sans','Work Sans','DM Sans','Lexend','Source Sans 3','Raleway','Merriweather'],manuscrite:['Caveat Brush','Kalam','Gochi Hand','Patrick Hand','Permanent Marker','Shadows Into Light','Itim']};
const CHARTE_DEF={titres:'Outfit',texte:'Outfit',manuscrite:'Caveat Brush',navy:'#13395A',coral:'#FF5A5F',blue:'#5E7CA6',mist:'#C4CED6',majuscules:'oui',tailleTitres:'1'};
function charteExtra(k){let x='';if(k.majuscules==='non')x+='.site h1,.site h2,.site h3,.site .pre,.site h2 span,.site h1 small{text-transform:none!important}';if(k.tailleTitres&&k.tailleTitres!=='1')x+=`.site h1,.site h2{zoom:${+k.tailleTitres}}`;return x;}
function applyCharte(C){const k=Object.assign({},CHARTE_DEF,C&&C.charte||{});const r=document.documentElement.style;
 r.setProperty('--f-title',`"${k.titres}",sans-serif`);r.setProperty('--f-body',`"${k.texte}",system-ui,sans-serif`);r.setProperty('--f-hand',`"${k.manuscrite}",cursive`);
 r.setProperty('--navy',k.navy);r.setProperty('--coral',k.coral);r.setProperty('--blue',k.blue);r.setProperty('--mist',k.mist);
 let xs=document.getElementById('charteExtra');if(!xs){xs=document.createElement('style');xs.id='charteExtra';document.head.appendChild(xs);}xs.textContent=charteExtra(k);
 const fams=[...new Set([k.titres,k.texte,k.manuscrite])].filter(f=>!['Outfit','Caveat Brush'].includes(f));let l=document.getElementById('charteFonts');
 if(fams.length){if(!l){l=document.createElement('link');l.id='charteFonts';l.rel='stylesheet';document.head.appendChild(l);}const u='https://fonts.googleapis.com/css2?'+fams.map(f=>'family='+f.replace(/ /g,'+')+':wght@400;500;600;700').join('&')+'&display=swap';if(l.href!==u)l.href=u;}
}
function openCharte(){DRAFT.charte=Object.assign({},CHARTE_DEF,DRAFT.charte||{});const k=DRAFT.charte;
 const sel=(id,list)=>`<select id="${id}">${list.map(f=>`<option${f===k[id]?' selected':''}>${f}</option>`).join('')}</select>`;
 const col=(id,l)=>`<label class="ccol"><input type="color" id="${id}" value="${k[id]}"> ${l}</label>`;
 $('#modal').innerHTML=`<div class="modal"><div><h3>Charte graphique</h3><p class="help">Ces réglages s'appliquent à tout le site. Les modifications s'affichent en direct derrière cette fenêtre.</p>
  <div class="cgrid"><div class="fld"><label>Police des titres</label>${sel('titres',FONTS.titres)}</div><div class="fld"><label>Police du texte</label>${sel('texte',FONTS.texte)}</div><div class="fld"><label>Police manuscrite (slogan)</label>${sel('manuscrite',FONTS.manuscrite)}</div></div>
  <h4>Titres</h4><div class="cgrid"><div class="fld"><label>Titres en majuscules</label><select id="majuscules"><option value="oui"${k.majuscules!=='non'?' selected':''}>Oui (charte EDM)</option><option value="non"${k.majuscules==='non'?' selected':''}>Non : tels que saisis</option></select></div><div class="fld"><label>Taille des titres</label><select id="tailleTitres">${[['0.85','Plus petits'],['1','Normale'],['1.15','Plus grands']].map(([v,l])=>`<option value="${v}"${(k.tailleTitres||'1')===v?' selected':''}>${l}</option>`).join('')}</select></div></div>
  <h4>Couleurs</h4><div class="cgrid">${col('navy','Bleu principal')}${col('blue','Bleu secondaire')}${col('coral','Corail')}${col('mist','Gris bleuté (fonds)')}</div>
  <p class="help">Charte de l'EDM : Graphie (remplacée ici par Outfit, libre de droits), bleu principal #13395a, bleu secondaire #5e7ca6, corail #ff5a5f.</p>
  <div class="actions"><button class="abtn" id="cReset">Revenir à la charte de l'EDM</button><span class="st"></span><button class="abtn pri" id="mCancel">Fermer</button></div></div></div>`;
 const upd=()=>{['titres','texte','manuscrite','navy','blue','coral','mist','majuscules','tailleTitres'].forEach(id=>k[id]=$('#'+id).value);dirty=true;applyCharte(DRAFT);editStatus();};
 $('#modal').querySelectorAll('select,input').forEach(x=>x.oninput=upd);
 $('#cReset').onclick=()=>{DRAFT.charte=Object.assign({},CHARTE_DEF);dirty=true;applyCharte(DRAFT);openCharte();};
 $('#mCancel').onclick=()=>{$('#modal').innerHTML='';renderEdit();};
 const mo=$('.modal');mo.style.background='rgba(29,29,54,.12)';mo.style.justifyContent='flex-end';mo.style.alignItems='flex-start';mo.style.paddingTop='100px';mo.firstElementChild.style.maxWidth='400px';mo.querySelectorAll('.cgrid').forEach(g=>g.style.gridTemplateColumns='1fr');
}


/* ============ pages du site (génération statique) ============ */
function sitePages(C){const out=[{route:'accueil',path:'',titre:C.site.nom}];
 C.masters.forEach(m=>out.push({route:'master-'+m.slug,path:(m.chemin||('master'+m.slug)),titre:'Master '+m.titre}));
 (C.pages||[]).forEach(p=>out.push({route:'page-'+p.slug,path:(p.chemin||p.slug),titre:p.titre}));return out;}
function charteCSS(C){const k=Object.assign({},CHARTE_DEF,C&&C.charte||{});return `:root{--f-title:"${k.titres}",sans-serif;--f-body:"${k.texte}",system-ui,sans-serif;--f-hand:"${k.manuscrite}",cursive;--navy:${k.navy};--coral:${k.coral};--blue:${k.blue};--mist:${k.mist}}`+charteExtra(k);}
function charteFontsURL(C){const k=Object.assign({},CHARTE_DEF,C&&C.charte||{});const f=[...new Set(['Outfit','Caveat Brush','Bitter','Russo One',k.titres,k.texte,k.manuscrite])];return 'https://fonts.googleapis.com/css2?'+f.map(x=>'family='+x.replace(/ /g,'+')+':wght@400;500;600;700').join('&').replace('family=Caveat+Brush:wght@400;500;600;700','family=Caveat+Brush').replace('family=Russo+One:wght@400;500;600;700','family=Russo+One').replace('family=Bitter:wght@400;500;600;700','family=Bitter:ital,wght@0,400;1,400')+'&display=swap';}
if(typeof module!=='undefined')module.exports={renderPage,sitePages,charteCSS,charteFontsURL,norm,setMode:(m,base)=>{MODE=m;ASSET_BASE=base||'';},setOrigin:(raw)=>{ORIGIN_RAW=JSON.parse(JSON.stringify(raw));ORIGIN_PAGES=JSON.parse(JSON.stringify(raw.pages||[]));}};
