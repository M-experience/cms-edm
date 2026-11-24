/* Cms-Edm - application d'administration */
/* ============ choix de la destination d'un lien ============ */
function linkTargets(){
 const pages=EPAGES();
 const secs=sectionsOf(DRAFT).filter(s=>!s.masque).map((s,i)=>s.type==='fixe'?['section-'+s.id,FIXED[s.id]?.label||s.id]:['section-'+(s.id||'bloc'+i),(LIB[s.type]?.label||'Section')+(s.titre?' : '+s.titre:'')]);
 const psecs=DRAFT.pages.flatMap(pg=>pg.sections.filter(x=>x.id&&x.type!=='sommaire').map(x=>['page-'+pg.slug+'--'+x.id,pg.titre+' › '+(x.titre||LIB[x.type]?.label||x.id)]));
 return {pages,secs,psecs};}
function openLinkChooser(p){
 const o=get(DRAFT,p),cur=o.cible||'';const {pages,secs,psecs}=linkTargets();
 const ext=/^(https?:|mailto:)/.test(cur);
 const opt=([v,l])=>`<label class="lopt"><input type="radio" name="lt" value="${esc(v)}"${v===cur?' checked':''}> ${esc(l)}</label>`;
 $('#modal').innerHTML=`<div class="modal"><div><h3>Destination du lien${o.libelle?` « ${esc(o.libelle)} »`:''}</h3>
  <h4>Pages</h4><div class="lgrid">${pages.map(opt).join('')}</div>
  <h4>Sections de la page d'accueil</h4><div class="lgrid">${secs.map(opt).join('')}</div>
  ${psecs.length?`<h4>Sections des autres pages</h4><div class="lgrid">${psecs.map(opt).join('')}</div>`:''}
  <h4>Lien externe</h4><label class="lopt"><input type="radio" name="lt" value="__ext"${ext?' checked':''}> Adresse web :</label>
  <input id="lext" class="lext" placeholder="https://..." value="${ext?esc(cur):''}">
  <p class="help">Une page manque ? Créez-la avec « + Nouvelle page... » dans la barre d'édition, puis revenez choisir la destination.</p>
  <div class="actions" style="margin-top:14px"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button><button class="abtn pri" id="mOk">Valider</button></div></div></div>`;
 $('#lext').oninput=()=>{const r=$('#modal').querySelector('input[value="__ext"]');r.checked=true;};
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mOk').onclick=()=>{const r=$('#modal').querySelector('input[name=lt]:checked');if(!r){$('#modal').innerHTML='';return;}
  let v=r.value;if(v==='__ext'){v=$('#lext').value.trim();if(!v)return;if(!/^(https?:|mailto:)/.test(v))v='https://'+v;}
  o.cible=v;$('#modal').innerHTML='';dirty=true;renderEdit();toast('Lien mis à jour');};
}

/* ============ création et suppression de pages ============ */
const slugify=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'page';
const TEMPLATES={
 vierge:{label:'Page vierge',desc:'Une section de texte, à compléter.',secs:()=>[{type:'texte',...clone(LIB.texte.def)}]},
 presentation:{label:'Page de présentation',desc:'Texte et image, cartes, puis bandeau d\'appel.',secs:()=>[{type:'texte-image',...clone(LIB['texte-image'].def)},{type:'cartes',...clone(LIB.cartes.def)},{type:'bandeau',...clone(LIB.bandeau.def)}]},
 chiffres:{label:'Page résultats',desc:'Texte, chiffres clés et citation.',secs:()=>[{type:'texte',...clone(LIB.texte.def)},{type:'chiffres',...clone(LIB.chiffres.def)},{type:'citation',...clone(LIB.citation.def)}]}
};
function openNewPage(){
 const sugg=['L\'école','Vie des masters','Candidater','Équipe','Intervenants','Accessibilité et handicap'].filter(t=>!DRAFT.pages.some(p=>p.titre===t));
 $('#modal').innerHTML=`<div class="modal"><div><h3>Nouvelle page</h3>
  <div class="fld"><label>Titre de la page</label><input id="npT" placeholder="Ex. L'école"></div>
  ${sugg.length?`<p class="help">Suggestions : ${sugg.map(t=>`<button class="chipbtn" data-sugg="${esc(t)}">${esc(t)}</button>`).join(' ')}</p>`:''}
  <p class="help">Adresse : <code id="npS">#page-...</code></p>
  <h4>Modèle de départ</h4><div class="lib">${Object.entries(TEMPLATES).map(([k,t],i)=>`<label class="tpl"><input type="radio" name="tpl" value="${k}"${i?'':' checked'}><b>${esc(t.label)}</b><span>${esc(t.desc)}</span></label>`).join('')}</div>
  <label class="lopt" style="margin-top:12px"><input type="checkbox" id="npM" checked> Ajouter la page au menu principal</label>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button><button class="abtn pri" id="mOk">Créer la page</button></div></div></div>`;
 const T=$('#npT'),S=$('#npS');
 const uniq=b=>{let s=b,n=2;while(DRAFT.pages.some(p=>p.slug===s))s=b+'-'+n++;return s;};
 const upd=()=>S.textContent='#page-'+uniq(slugify(T.value||'page'));
 T.oninput=upd;T.focus();
 $('#modal').querySelectorAll('[data-sugg]').forEach(b=>b.onclick=()=>{T.value=b.dataset.sugg;upd();});
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mOk').onclick=()=>{const titre=T.value.trim();if(!titre){T.focus();return;}
  const slug=uniq(slugify(titre)),tpl=$('#modal').querySelector('input[name=tpl]:checked').value;
  const secs=TEMPLATES[tpl].secs().map((x,i)=>({id:'bloc'+Date.now().toString(36)+i,...x}));
  DRAFT.pages.push({slug,titre,chapo:'Une phrase d\'introduction pour cette page.',sections:secs});
  if($('#npM').checked){const ex=DRAFT.site.menu.find(m=>m.libelle.trim().toLowerCase()===titre.toLowerCase());if(ex)ex.cible='page-'+slug;else DRAFT.site.menu.push({libelle:titre,cible:'page-'+slug});}
  dirty=true;$('#modal').innerHTML='';goEdit('page-'+slug);toast('Page « '+titre+' » créée : elle sera en ligne à la prochaine publication');};
}
function openDeletePage(){
 const pi=DRAFT.pages.findIndex(p=>'page-'+p.slug===section);if(pi<0)return;const pg=DRAFT.pages[pi];
 $('#modal').innerHTML=`<div class="modal"><div><h3>Supprimer la page « ${esc(pg.titre)} » ?</h3><p>Les liens et entrées de menu qui pointent vers cette page seront retirés ou redirigés vers l'accueil. La suppression ne sera effective qu'à la prochaine publication, et l'historique permet de revenir en arrière.</p>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button><button class="abtn cor" id="mOk">Supprimer</button></div></div></div>`;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mOk').onclick=()=>{const t='page-'+pg.slug;DRAFT.pages.splice(pi,1);
  DRAFT.site.menu=DRAFT.site.menu.filter(m=>m.cible!==t);
  (function walk(o){if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object'){if(o.cible===t)o.cible='accueil';Object.values(o).forEach(walk);}})(DRAFT);
  dirty=true;$('#modal').innerHTML='';goEdit('accueil');toast('Page supprimée du brouillon');};
}

/* ============ édition sur la page ============ */
const EPAGES=()=>[['accueil','Page d\'accueil'],...DRAFT.masters.map(m=>['master-'+m.slug,'Master '+m.sigle]),...DRAFT.pages.map(p=>['page-'+p.slug,p.titre||p.slug])];
function editBar(pg){
 return `<div class="editbar"><a class="abtn" href="#/" title="Retour à la liste des sites">← Sites</a><b>${esc(SITE.nom)}</b>
  <select id="epage">${EPAGES().map(([k,l])=>`<option value="${k}"${k===pg?' selected':''}>${esc(l)}</option>`).join('')}<option value="__new">+ Nouvelle page...</option></select>${pg.startsWith('page-')?`<button class="abtn" id="eDelPage" title="Supprimer cette page">Supprimer la page</button>`:''}
  <span class="est" id="est">${esc(statusLine())}</span><span id="presence" class="presence"></span>
  <a class="abtn" href="aide.html" target="_blank" rel="noopener" title="Mode d'emploi (nouvel onglet)">Aide</a>
  <button class="abtn" data-charte="1" title="Polices et couleurs du site">Charte</button>
  <button class="abtn" id="eHist">Historique</button>
  <a class="abtn pri" href="#/apercu/${esc(SITE.slug)}/${esc(pg)}" title="Voir la page telle qu'elle sera publiée (modifications non enregistrées comprises)">Aperçu</a>
  ${SITE.domaine?`<a class="abtn" href="${esc(previewURL(pg))}" target="_blank" rel="noopener" title="Adresse publique du site. Tant que le DNS n'est pas modifié, elle affiche encore l'ancien site (Wix).">${esc(SITE.domaine)} ↗</a>`:''}
  <button class="abtn" id="eUndo" ${dirty?'':'disabled'}>Annuler</button>
  <button class="abtn" id="eSave" ${!dirty?'disabled':''}>Enregistrer le brouillon</button>
  ${!canPublish()?`<button class="abtn cor" id="eSubmit">Soumettre à validation</button>`:`<button class="abtn pri" id="ePub">Publier</button>`}
 </div>
 <div class="ehelp">Cliquez sur un texte pour le modifier, sur une image pour la changer. Survolez un élément pour le déplacer ou le supprimer.${pg==='accueil'||pg.startsWith('page-')?' « + Ajouter une section » puise dans la bibliothèque.':''}</div>`;
}
/* ============ glisser-déposer des sections et des éléments ============ */
function startDnD(ev,btn){
 const isSec=!!btn.dataset.secdrag;ev.preventDefault();ev.stopPropagation();
 const src=btn.closest(isSec?'.esec':'.ei');if(!src)return;
 const key=isSec?btn.dataset.sp:btn.dataset.p,si=+(isSec?btn.dataset.si:btn.dataset.i);
 const targets=()=>isSec?[...document.querySelectorAll('.esec')].filter(e=>e.dataset.sp===key):[...document.querySelectorAll('.itools [data-lidrag]')].filter(b=>b.dataset.p===key).map(b=>b.closest('.ei'));
 const T=targets(),idx=el=>T.indexOf(el);let drop=null;
 src.classList.add('dragging');document.body.classList.add('dnd');
 const clear=()=>T.forEach(e=>e.classList.remove('drop-before','drop-after','vert'));
 const move=m=>{clear();drop=null;const el=document.elementFromPoint(m.clientX,m.clientY);const t=el&&T.find(x=>x.contains(el));if(!t||t===src)return;
  const r=t.getBoundingClientRect();let before,vert=true;
  if(isSec)before=m.clientY<r.top+r.height/2;
  else{const row=T.some(o=>o!==t&&Math.abs(o.getBoundingClientRect().top-r.top)<10);vert=!row;before=row?m.clientX<r.left+r.width/2:m.clientY<r.top+r.height/2;}
  t.classList.add(before?'drop-before':'drop-after');if(vert)t.classList.add('vert');drop={i:idx(t),before};
  if(m.clientY<70)scrollBy(0,-20);else if(m.clientY>innerHeight-50)scrollBy(0,20);};
 const up=()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);clear();src.classList.remove('dragging');document.body.classList.remove('dnd');
  if(!drop)return;let to=drop.i+(drop.before?0:1);if(to>si)to--;if(to===si)return;
  const arr=isSec?ensureSections(JSON.parse(key)):get(DRAFT,JSON.parse(key));const [x]=arr.splice(si,1);arr.splice(to,0,x);dirty=true;renderEdit();toast(isSec?'Section déplacée':'Élément déplacé');};
 addEventListener('pointermove',move);addEventListener('pointerup',up);
}
document.addEventListener('pointerdown',ev=>{const b=ev.target.closest&&ev.target.closest('[data-secdrag],[data-lidrag]');if(b&&document.querySelector('.site.editing'))startDnD(ev,b);},true);

/* ============ éléments graphiques déplaçables (accueil) ============ */
let DECO_SEL=-1;
function decoArr(){if(!DRAFT.site.deco)DRAFT.site.deco=clone(DECO_DEF);return DRAFT.site.deco;}
function decoToolbar(){document.querySelectorAll('.deco-tb').forEach(x=>x.remove());document.querySelectorAll('.deco-ed.sel').forEach(x=>x.classList.remove('sel'));
 const el=document.querySelector(`.deco-ed[data-deco="${DECO_SEL}"]`);if(!el)return;el.classList.add('sel');
 const d=decoArr()[DECO_SEL],tb=document.createElement('span');tb.className='deco-tb';tb.contentEditable='false';
 tb.innerHTML=`<button data-dk="rl" title="Pivoter à gauche">↺</button><button data-dk="rr" title="Pivoter à droite">↻</button><button data-dk="sm" title="Réduire">−</button><button data-dk="lg" title="Agrandir">+</button><button data-dk="fl" title="Retourner">⇋</button><button data-imgp='${J(['site','deco',DECO_SEL,'src'])}' title="Changer l'image">🖼</button><button data-dk="dup" title="Dupliquer">⧉</button><button data-dk="del" title="Supprimer">✕</button><button data-dk="ok" title="Terminer">✓</button>`;
 tb.style.left=(+d.x||0)+'px';tb.style.bottom=((+d.y||0)-40)+'px';el.parentNode.appendChild(tb);}
function bindDeco(){
 const wrap=document.querySelector('.hero .wrap');if(!wrap)return;
 wrap.querySelectorAll('.deco-ed').forEach(el=>{el.onpointerdown=ev=>{ev.preventDefault();const i=+el.dataset.deco,d=decoArr()[i];const sx=ev.clientX,sy=ev.clientY,ox=+d.x||0,oy=+d.y||0;let moved=false;el.setPointerCapture(ev.pointerId);el.classList.add('drag');
  el.onpointermove=m=>{const dx=m.clientX-sx,dy=m.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;el.style.left=(ox+dx)+'px';el.style.bottom=(oy-dy)+'px';document.querySelectorAll('.deco-tb').forEach(x=>x.remove());};
  el.onpointerup=m=>{el.onpointermove=null;el.onpointerup=null;el.classList.remove('drag');if(moved){d.x=Math.round(ox+m.clientX-sx);d.y=Math.round(oy-(m.clientY-sy));dirty=true;editStatus&&editStatus();}DECO_SEL=i;decoToolbar();};};});
 wrap.onclick=ev=>{const b=ev.target.closest('[data-dk],[data-decoadd]');if(!b)return;ev.preventDefault();ev.stopPropagation();const A=decoArr();
  if(b.dataset.decoadd){A.push({src:'img/arrow-right.svg',x:300,y:-60,w:90,rot:0,flip:''});DECO_SEL=A.length-1;dirty=true;renderEdit();return;}
  const d=A[DECO_SEL];if(!d)return;const k=b.dataset.dk;
  if(k==='rl')d.rot=(+d.rot||0)-10; if(k==='rr')d.rot=(+d.rot||0)+10;
  if(k==='sm')d.w=Math.max(20,(+d.w||90)-10); if(k==='lg')d.w=Math.min(600,(+d.w||90)+10);
  if(k==='fl')d.flip=d.flip?'':'1';
  if(k==='dup'){A.push({...clone(d),x:(+d.x||0)+30,y:(+d.y||0)-30});DECO_SEL=A.length-1;}
  if(k==='del'){A.splice(DECO_SEL,1);DECO_SEL=-1;}
  if(k==='ok'){DECO_SEL=-1;decoToolbar();return;}
  dirty=true;renderEdit();};
 if(DECO_SEL>=0)decoToolbar();
 document.addEventListener('pointerdown',ev=>{if(DECO_SEL>=0&&!ev.target.closest('.deco-ed,.deco-tb')){DECO_SEL=-1;decoToolbar();}},{once:true,capture:true});
}
function renderEdit(){
 const pg=EDIT_PAGE||'accueil';
 section=pg;
 if(!DRAFT) DRAFT=clone(draftMeta?.content||live());
 const y=scrollY;
 EDIT=true;let html;try{html=renderPage(DRAFT,pg);}finally{EDIT=false;}
 $('#app').className='';
 $('#app').innerHTML=editBar(pg)+`<div class="site editing">${html}</div>`;
 scrollTo(0,y);
 bindDeco();
}
function editStatus(){const s=$('#est');if(s)s.textContent=statusLine();const a=$('#eSave');if(a)a.disabled=!dirty;const u=$('#eUndo');if(u)u.disabled=!dirty;}
const isEditRoute=()=>VIEW==='edit';
function ensureSections(sp){if(!sp||sp[0]==='accueil'){if(!DRAFT.accueil.sections)DRAFT.accueil.sections=clone(sectionsOf(DRAFT));return DRAFT.accueil.sections;}return get(DRAFT,sp);}
async function openImagePicker(p,logos){const LIST=logos?[...LOGOS,...IMAGES]:IMAGES;
 const cur=get(DRAFT,p);
 $('#modal').innerHTML=`<div class="modal"><div><h3>Choisir une image</h3>
  <div class="upl"><label class="abtn pri">Envoyer une image depuis l'ordinateur<input type="file" accept="image/*" id="upF" hidden></label><span class="help" id="upS">JPG, PNG, SVG ou WebP, 20 Mo maximum.</span></div>
  <div id="upList"></div>
  <h4>Images du thème</h4><div class="picker${logos?' logos':''}">${LIST.map(s=>`<img src="${esc(asset(s))}" data-pick="${esc(s)}" class="${cur===s?'on':''}" alt="">`).join('')}</div>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Fermer</button></div></div></div>`;
 const pick=v=>{set(DRAFT,p,v);$('#modal').innerHTML='';dirty=true;renderEdit();};
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#modal').querySelectorAll('[data-pick]').forEach(im=>im.onclick=()=>pick(im.dataset.pick));
 try{const {data}=await sb.storage.from('medias').list(SITE.id,{limit:200,sortBy:{column:'created_at',order:'desc'}});
  const im=(data||[]).filter(f=>f.name&&!f.name.startsWith('.'));
  if(im.length&&$('#upList'))$('#upList').innerHTML=`<h4>Images envoyées</h4><div class="picker${logos?' logos':''}">${im.map(f=>{const u=sb.storage.from('medias').getPublicUrl(SITE.id+'/'+f.name).data.publicUrl;return `<img src="${esc(u)}" data-pick="${esc(u)}" class="${cur===u?'on':''}" alt="">`;}).join('')}</div>`;
  $('#upList')?.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>pick(x.dataset.pick));}catch(err){}
 $('#upF').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const st=$('#upS');st.textContent='Envoi en cours...';
  const name=Date.now().toString(36)+'-'+slugify(f.name.replace(/\.[^.]+$/,''))+(f.name.match(/\.[^.]+$/)||[''])[0].toLowerCase();
  const {error}=await sb.storage.from('medias').upload(SITE.id+'/'+name,f,{cacheControl:'31536000',upsert:false});
  if(error){st.textContent='Envoi refusé : '+error.message;return;}
  pick(sb.storage.from('medias').getPublicUrl(SITE.id+'/'+name).data.publicUrl);toast('Image envoyée');};
}
function openLibrary(at,sp){
 const secs=ensureSections(sp);
 const hidden=secs.map((s,i)=>[s,i]).filter(([s])=>s.masque);
 $('#modal').innerHTML=`<div class="modal"><div><h3>Ajouter une section</h3><p class="help">Les sections de la bibliothèque reprennent la charte du site : vous choisissez le modèle, puis vous écrivez directement dedans.</p>
  <div class="lib">${Object.entries(LIB).map(([k,l])=>`<button data-lib="${k}"><b>${esc(l.label)}</b><span>${esc(l.desc)}</span></button>`).join('')}</div>
  ${hidden.length?`<h4 style="margin-top:18px">Sections masquées</h4><div class="lib">${hidden.map(([s,i])=>`<button data-unhide="${i}"><b>${esc(FIXED[s.id]?.label||s.id)}</b><span>Réafficher à cet endroit</span></button>`).join('')}</div>`:''}
  <div class="actions" style="margin-top:14px"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button></div></div></div>`;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#modal').querySelectorAll('[data-lib]').forEach(b=>b.onclick=()=>{const arr=ensureSections(sp);arr.splice(at,0,{type:b.dataset.lib,id:'bloc'+Date.now().toString(36),...clone(LIB[b.dataset.lib].def)});$('#modal').innerHTML='';dirty=true;renderEdit();setTimeout(()=>document.querySelectorAll('.esec')[at]?.scrollIntoView({behavior:'smooth',block:'center'}),50);});
 $('#modal').querySelectorAll('[data-unhide]').forEach(b=>b.onclick=()=>{const arr=ensureSections(sp);const i=+b.dataset.unhide;const [s]=arr.splice(i,1);delete s.masque;arr.splice(i<at?at-1:at,0,s);$('#modal').innerHTML='';dirty=true;renderEdit();});
}
let rtbEl=null,rtbRange=null;
function rtbShow(el){
 if(!rtbEl){rtbEl=document.createElement('div');rtbEl.className='rtb';rtbEl.innerHTML=`<button data-cmd="bold" title="Gras (Cmd+B)"><b>G</b></button><button data-cmd="italic" title="Italique (Cmd+I)"><i>I</i></button><button data-cmd="link" title="Lien">🔗</button><button data-cmd="h3" title="Intertitre">Intertitre</button><button data-cmd="p" title="Paragraphe normal">¶</button><button data-cmd="insertUnorderedList" title="Liste à puces">• Liste</button><button data-cmd="insertOrderedList" title="Liste numérotée">1. Liste</button><button data-cmd="removeFormat" title="Effacer la mise en forme">✕ Format</button><span class="rtb-link" hidden><input placeholder="https://..."><button data-cmd="linkok">OK</button><button data-cmd="linkno" title="Annuler">✕</button></span><button data-cmd="done" class="rtb-done" title="Terminer la modification (Échap)">✓ Terminé</button>`;
  document.body.appendChild(rtbEl);
  rtbEl.addEventListener('mousedown',e=>{if(!e.target.closest('input'))e.preventDefault();});
  rtbEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const c=b.dataset.cmd;const box=rtbEl.querySelector('.rtb-link');
   if(c==='link'){const sel=getSelection();rtbRange=sel.rangeCount?sel.getRangeAt(0).cloneRange():null;box.hidden=false;box.querySelector('input').value='';box.querySelector('input').focus();return;}
   if(c==='linkno'){box.hidden=true;return;}
   if(c==='done'){rtbHide();document.activeElement?.blur();getSelection().removeAllRanges();return;}
   if(c==='linkok'){let u=box.querySelector('input').value.trim();box.hidden=true;if(!u||!rtbRange)return;if(!/^(https?:|mailto:|#)/.test(u))u='https://'+u;const sel=getSelection();sel.removeAllRanges();sel.addRange(rtbRange);document.execCommand('createLink',false,u);return;}
   if(c==='removeFormat'){document.execCommand('removeFormat');document.execCommand('unlink');return;}
   if(c==='h3'||c==='p'){document.execCommand('formatBlock',false,c);return;}
   document.execCommand(c);});
  rtbEl.querySelector('.rtb-link input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();rtbEl.querySelector('[data-cmd=linkok]').click();}});
 }
 rtbEl.dataset.for='1';rtbEl.hidden=false;rtbEl.querySelector('.rtb-link').hidden=true;const r=el.getBoundingClientRect();
 rtbEl.style.top=Math.max(96,r.top+scrollY-46)+'px';rtbEl.style.left=Math.max(8,r.left+scrollX)+'px';
}
function rtbHide(){if(rtbEl){rtbEl.hidden=true;rtbEl.querySelector('.rtb-link').hidden=true;}}
function bindEditOnce(){
 const app=$('#app');
 try{document.execCommand('defaultParagraphSeparator',false,'p');}catch(e){}
 app.addEventListener('focusin',e=>{if(!isEditRoute())return;const el=e.target.closest('[data-rich]');if(el)rtbShow(el);else rtbHide();});
 document.addEventListener('mousedown',e=>{if(rtbEl&&!rtbEl.hidden&&!e.target.closest('.rtb')&&!e.target.closest('[data-rich]'))rtbHide();});
 app.addEventListener('focusout',e=>{setTimeout(()=>{if(rtbEl&&!document.activeElement?.closest('[data-rich]')&&!document.activeElement?.closest('.rtb'))rtbHide();},150);});
 app.addEventListener('input',e=>{
  if(!isEditRoute())return;const el=e.target.closest('[data-e]');if(!el)return;
  let v=el.dataset.rich?toMd(el):(el.dataset.para?el.innerText:el.textContent).replace(/\u00a0/g,' ');
  v=el.dataset.para?v.replace(/\n{3,}/g,'\n\n').trim():v.replace(/\s*\n\s*/g,' ').trim();
  set(DRAFT,JSON.parse(el.dataset.e),v);dirty=true;editStatus();
 });
 app.addEventListener('keydown',e=>{if(!isEditRoute())return;const el=e.target.closest('[data-e]');if(el&&e.key==='Enter'&&!el.dataset.para){e.preventDefault();el.blur();}});
 app.addEventListener('paste',e=>{if(!isEditRoute())return;const el=e.target.closest('[data-e]');if(!el)return;e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain'));});
 app.addEventListener('click',e=>{
  if(!isEditRoute())return;
  const t=e.target;
  if(t.closest('.editing a')&&!t.closest('button'))e.preventDefault();
  if(t.closest('.editing summary'))e.preventDefault();
  const b=t.closest('button,[data-imgp]');if(!b)return;
  if(b.id==='eSave'){saveDraft('brouillon');return;}
  if(b.id==='eSubmit'){saveDraft('en_validation');return;}
  if(b.id==='ePub'){openPublish();return;}
  if(b.id==='eHist'){openHistory();return;}
  if(b.id==='eUndo'){DRAFT=norm(clone(CONTENT.draft||CONTENT.published||ORIGIN_RAW));dirty=false;applyCharte(DRAFT);renderEdit();toast('Modifications annulées');return;}
  if(b.dataset.link){e.preventDefault();openLinkChooser(JSON.parse(b.dataset.link));return;}
  if(b.dataset.imgp){openImagePicker(JSON.parse(b.dataset.imgp),b.dataset.logos);return;}
  if(b.dataset.ins){openLibrary(+b.dataset.ins,JSON.parse(b.dataset.sp));return;}
  if(b.id==='eDelPage'){openDeletePage();return;}
  if(b.dataset.size){e.preventDefault();const p=JSON.parse(b.dataset.sp);const v=Math.max(12,Math.min(160,(+get(DRAFT,p)||+b.dataset.sdef)+4*(+b.dataset.size)));set(DRAFT,p,v);dirty=true;renderEdit();return;}
  if(b.dataset.charte!==undefined){openCharte();return;}
  if(b.dataset.color){set(DRAFT,JSON.parse(b.dataset.color),b.dataset.c);dirty=true;renderEdit();return;}
  if(b.dataset.pts){e.preventDefault();if(b.dataset.pts==='off')DRAFT.accueil.etapes_points='non';else delete DRAFT.accueil.etapes_points;dirty=true;renderEdit();return;}
  if(b.dataset.flip){const p=JSON.parse(b.dataset.flip);set(DRAFT,p,get(DRAFT,p)?'':'1');dirty=true;renderEdit();return;}
  if(b.dataset.sec){e.preventDefault();const arr=ensureSections(JSON.parse(b.dataset.sp)),i=+b.dataset.si,a=b.dataset.sec;
   if(a==='up'&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];
   if(a==='down'&&i<arr.length-1)[arr[i+1],arr[i]]=[arr[i],arr[i+1]];
   if(a==='hide')arr[i].masque=true; if(a==='show')delete arr[i].masque;
   if(a==='del')arr.splice(i,1);
   if(a==='align'){const n={'':'center',center:'right',right:''};arr[i].align=n[arr[i].align||''];if(!arr[i].align)delete arr[i].align;}
   if(a==='width'){const n={'':'etroit',etroit:'large',large:''};arr[i].largeur=n[arr[i].largeur||''];if(!arr[i].largeur)delete arr[i].largeur;}
   dirty=true;renderEdit();return;}
  if(b.dataset.li){e.preventDefault();const arr=get(DRAFT,JSON.parse(b.dataset.p)),i=+b.dataset.i;
   if(b.dataset.li==='del')arr.splice(i,1); if(b.dataset.li==='up'&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];
   dirty=true;renderEdit();return;}
  if(b.dataset.add){e.preventDefault();const p=JSON.parse(b.dataset.add);let arr=get(DRAFT,p);if(!arr){set(DRAFT,p,[]);arr=get(DRAFT,p);}arr.push(clone(JSON.parse(b.dataset.tpl)));dirty=true;renderEdit();return;}
 });
 app.addEventListener('change',e=>{
  if(!isEditRoute())return;
  if(e.target.id==='epage'){if(e.target.value==='__new'){e.target.value=section;openNewPage();return;}goEdit(e.target.value);}
 });
}


/* ============ Cms-Edm : configuration ============ */
const SUPABASE_URL='https://gtletlvgbjqqjnmhjdfd.supabase.co';
const SUPABASE_KEY='sb_publishable_1BYm4PUC-4xmylhcinXznA_2u-F5zEp';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,detectSessionInUrl:true}});

/* ============ identité visuelle ============ */
const LOGO=`<svg class="lgmark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#13395A"/><rect x="14" y="16" width="36" height="7" rx="3.5" fill="#fff"/><rect x="14" y="28.5" width="22" height="7" rx="3.5" fill="#9DB3D6"/><rect x="40" y="26.5" width="4" height="11" rx="2" fill="#FF5A5F"/><rect x="14" y="41" width="30" height="7" rx="3.5" fill="#fff" fill-opacity=".45"/></svg>`;
const brand=(cls='')=>`<span class="brand ${cls}">${LOGO}<span class="bword">cms<i>-</i><em>edm</em></span></span>`;

/* ============ état ============ */
let SESSION=null,ME=null,SITES=[],SITE=null,ROLE=null,CONTENT=null,ORIGIN=null;
let DRAFT=null,draftMeta=null,dirty=false,section='accueil',VIEW='loading',EDIT_PAGE='accueil';
let presenceCh=null;
const ROLES={admin:'Administrateur',validateur:'Validateur',redacteur:'Rédacteur'};
const canPublish=()=>ROLE==='admin'||ROLE==='validateur';
const live=()=>CONTENT&&CONTENT.published?norm(clone(CONTENT.published)):ORIGIN;
function statusLine(){
 if(dirty)return 'Modifications non enregistrées';
 if(draftMeta&&draftMeta.at)return (draftMeta.statut==='en_validation'?'Soumis à validation le ':'Brouillon enregistré le ')+fmtDate(draftMeta.at);
 return CONTENT&&CONTENT.published_at?'Publié le '+fmtDate(CONTENT.published_at):'Jamais publié';
}
function siteURL(s){return s.domaine?('https://'+s.domaine.replace(/^https?:\/\//,'').replace(/\/$/,'')):(s.url_apercu||'');}
function previewURL(pg){const base=siteURL(SITE);if(!base)return '#';MODE='static';const p=routePath(pg);MODE='spa';return base+p;}
function goEdit(pg){location.hash='#/site/'+SITE.slug+'/'+pg;}

/* ============ thème (contenu par défaut et images) ============ */
async function loadTheme(theme){
 const raw=await fetch('themes/'+theme+'/content.json',{cache:'no-cache'}).then(r=>r.json());
 ORIGIN_RAW=clone(raw);ORIGIN_PAGES=clone(raw.pages||[]);ORIGIN=norm(clone(raw));ASSET_BASE='themes/'+theme+'/';
}

/* ============ connexion ============ */
function loginHTML(msg=''){
 return `<div class="login"><div class="lbox"><div class="lhead">${brand('big')}<p class="help">Gestion des sites de l'École du Design des Mutations</p></div>
  <form id="fPwd"><label>Adresse e-mail<input type="email" id="pEmail" required autocomplete="email"></label><label>Mot de passe<input type="password" id="pPwd" required autocomplete="current-password"></label>
   <button class="abtn pri">Se connecter</button></form>
  <p class="lfirst"><button type="button" class="linkbtn" id="pFirst">Première connexion ou mot de passe oublié ?</button></p>
  <form id="fFirst" hidden><p class="help">Indiquez votre adresse : vous recevrez un e-mail avec un lien pour choisir votre mot de passe.</p><label>Adresse e-mail<input type="email" id="fEmail" required autocomplete="email"></label><button class="abtn pri">Recevoir le lien</button></form>
  <p class="lmsg" id="lMsg">${esc(msg)}</p>
  <p class="help">L'accès est réservé aux personnes invitées sur au moins un site. <a href="aide.html" target="_blank" rel="noopener">Mode d'emploi</a></p></div></div>`;
}
function bindLogin(){
 const msg=t=>$('#lMsg').textContent=t;
 const base=location.origin+location.pathname;
 $('#fPwd').onsubmit=async e=>{e.preventDefault();msg('Connexion...');const {error}=await sb.auth.signInWithPassword({email:$('#pEmail').value.trim(),password:$('#pPwd').value});msg(error?(error.message==='Invalid login credentials'?'Adresse ou mot de passe incorrect. Première connexion ? Utilisez le lien ci-dessous.':'Erreur : '+error.message):'');};
 $('#pFirst').onclick=()=>{const f=$('#fFirst');f.hidden=!f.hidden;if(!f.hidden){$('#fEmail').value=$('#pEmail').value;$('#fEmail').focus();}};
 $('#fFirst').onsubmit=async e=>{e.preventDefault();const email=$('#fEmail').value.trim().toLowerCase();msg('Envoi en cours...');
  let invited=false;try{const r=await sb.rpc('peut_creer_compte',{p_email:email});invited=!!r.data;}catch(_){}
  const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:base+'?mdp=1',shouldCreateUser:invited}});
  // message identique que l'adresse soit invitée ou non : on ne révèle pas qui a accès
  const neutral='Si cette adresse a été invitée, un e-mail vient de lui être envoyé. Ouvrez le lien qu\'il contient pour choisir votre mot de passe (pensez aux indésirables).';
  msg(error&&!/signups? not allowed|not found|otp_disabled/i.test(error.message)?(/rate|seconds/i.test(error.message)?'Trop de demandes : patientez une minute avant de réessayer.':'Erreur : '+error.message):neutral);};
}
function newPasswordHTML(){return `<div class="login"><div class="lbox"><h1>Choisissez votre mot de passe</h1><p class="help">Il vous servira pour vos prochaines connexions, avec votre adresse e-mail.</p><form id="fNew"><label>Mot de passe (10 caractères minimum)<input type="password" id="nPwd" minlength="10" required autocomplete="new-password"></label><label>Confirmez le mot de passe<input type="password" id="nPwd2" minlength="10" required autocomplete="new-password"></label><button class="abtn pri">Enregistrer</button></form><p class="lmsg" id="lMsg"></p></div></div>`;}

/* ============ liste des sites ============ */
async function loadSites(){
 const {data,error}=await sb.from('sites').select('*, contents(published_at, draft_at, draft_status), builds(status, created_at, finished_at)').order('created_at');
 if(error){toast('Erreur : '+error.message);SITES=[];return;}
 SITES=data||[];
 const {data:mem}=await sb.from('site_members').select('site_id, role').eq('user_id',SESSION.user.id);
 const R={};(mem||[]).forEach(m=>R[m.site_id]=m.role);SITES.forEach(s=>s._role=ME.is_superadmin?'admin':R[s.id]);
}
function lastBuild(s){const b=(s.builds||[]).slice().sort((a,b)=>a.created_at<b.created_at?1:-1)[0];return b;}
const BSTAT={en_attente:'génération en attente',en_cours:'génération en cours',ok:'en ligne',erreur:'erreur de génération'};
function sitesHTML(){
 const act=SITES.filter(s=>s.statut==='actif'),arc=SITES.filter(s=>s.statut!=='actif');
 const ST={ok:['ok','En ligne'],en_attente:['wait','Mise en ligne en attente'],en_cours:['wait','Mise en ligne en cours'],erreur:['err','Erreur de mise en ligne']};
 const card=s=>{const c=(s.contents&&s.contents[0])||s.contents||{};const b=lastBuild(s);const par=SITES.find(x=>x.id===s.parent_id);const st=b?ST[b.status]:null;
  return `<div class="scard"><div class="sc-main">
   <div class="sc-title"><h3>${esc(s.nom)}</h3><span class="badge">${esc(ROLES[s._role]||'')}</span></div>
   <div class="sc-meta">${s.domaine?`<a href="${esc(siteURL(s))}" target="_blank" rel="noopener">${esc(s.domaine)} ↗</a>`:'<i>Aucun domaine</i>'}
    ${st?`<span class="st st-${st[0]}"><i></i>${st[1]}</span>`:''}<span>${c.published_at?'Publié le '+fmtDate(c.published_at):'Jamais publié'}</span>${c.draft_status==='en_validation'?'<span class="st st-wait"><i></i>Brouillon à valider</span>':''}</div>
   ${par?`<p class="help">Nouvelle version de « ${esc(par.nom)} »</p>`:''}</div>
   <div class="sc-act"><a class="abtn pri" href="#/site/${esc(s.slug)}/accueil">Modifier le site</a><button class="abtn ghost" data-msg="${s.id}">Messages</button>${s._role==='admin'?`<button class="abtn ghost" data-set="${s.id}">Paramètres</button><button class="abtn ghost" data-dup="${s.id}" title="Copier ce site pour préparer une refonte">Nouvelle version</button>`:''}</div></div>`;};
 return `<div class="topbar">${brand('on-dark')}<span class="sp"></span><span class="help">${esc(ME.email||'')}${ME.is_superadmin?' · super-administrateur':''}</span><a class="abtn" href="aide.html" target="_blank" rel="noopener">Mode d'emploi</a><button class="abtn" id="bLogout">Se déconnecter</button></div>
 <div class="dash"><div class="dhead"><h1>Vos sites</h1>${ME.is_superadmin?'<button class="abtn pri" id="bNewSite">+ Nouveau site</button>':''}</div>
 ${act.length?`<div class="sgrid">${act.map(card).join('')}</div>`:'<p class="empty-hint">Vous n\'êtes encore membre d\'aucun site. Demandez à un administrateur de vous inviter avec cette adresse e-mail.</p>'}
 ${arc.length?`<h2 class="help" style="margin-top:30px">Sites archivés</h2><div class="sgrid">${arc.map(card).join('')}</div>`:''}</div>`;
}
function bindSites(){
 clearTimeout(window.__poll);if(SITES.some(x=>{const b=lastBuild(x);return b&&(b.status==='en_attente'||b.status==='en_cours');}))window.__poll=setTimeout(async()=>{if(VIEW!=='sites')return;await loadSites();if(VIEW==='sites')render();},5000);
 $('#bLogout').onclick=async()=>{await sb.auth.signOut();};
 $('#bNewSite')?.addEventListener('click',()=>openNewSite(null));
 document.querySelectorAll('[data-dup]').forEach(b=>b.onclick=()=>openNewSite(b.dataset.dup));
 document.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>openSettings(b.dataset.set));
 document.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>openMessages(b.dataset.msg));
}
function openNewSite(fromId){
 const src=fromId&&SITES.find(s=>s.id===fromId);
 $('#modal').innerHTML=`<div class="modal"><div><h3>${src?'Nouvelle version de « '+esc(src.nom)+' »':'Nouveau site'}</h3>
  ${src?'<p class="help">Le nouveau site part d\'une copie du contenu actuel (brouillon compris). Vous pourrez le remanier librement, puis lui attribuer le nom de domaine du site d\'origine le moment venu.</p>':'<p class="help">Le nouveau site part du contenu du thème EDM, que vous remaniez ensuite.</p>'}
  <div class="fld"><label>Nom du site</label><input id="nsNom" value="${src?esc(src.nom)+' (nouvelle version)':''}"></div>
  <div class="fld"><label>Identifiant (lettres, chiffres, tirets)</label><input id="nsSlug" value="${src?esc(src.slug)+'-v2':''}"></div>
  <div class="fld"><label>Nom de domaine (facultatif, modifiable plus tard)</label><input id="nsDom" placeholder="ex. nouveau.ecole-edm.fr"></div>
  <p class="lmsg" id="nsMsg"></p>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button><button class="abtn pri" id="mOk">Créer le site</button></div></div></div>`;
 $('#nsNom').oninput=()=>{if(!src)$('#nsSlug').value=slugify($('#nsNom').value);};
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mOk').onclick=async()=>{const nom=$('#nsNom').value.trim(),slug=slugify($('#nsSlug').value),dom=$('#nsDom').value.trim()||null;if(!nom){$('#nsMsg').textContent='Indiquez un nom.';return;}
  const {data:id,error}=await sb.rpc('create_site',{p_slug:slug,p_nom:nom,p_domaine:dom,p_dossier:null,p_from:fromId||null});
  if(error){$('#nsMsg').textContent='Erreur : '+error.message;return;}
  if(!fromId){await sb.rpc('save_draft',{p_site:id,p_content:ORIGIN_RAW,p_status:'brouillon'});}
  $('#modal').innerHTML='';toast('Site créé');await loadSites();render();};
}
async function openSettings(id){
 const s=SITES.find(x=>x.id===id);
 const [{data:mem},{data:inv}]=await Promise.all([sb.from('site_members').select('user_id, role, profiles(email, nom)').eq('site_id',id),sb.from('site_invites').select('*').eq('site_id',id)]);
 const roleSel=(v,attr)=>`<select ${attr}>${Object.entries(ROLES).map(([k,l])=>`<option value="${k}"${k===v?' selected':''}>${l}</option>`).join('')}</select>`;
 $('#modal').innerHTML=`<div class="modal"><div class="wide"><h3>Paramètres : ${esc(s.nom)}</h3>
  <div class="cgrid2"><div class="fld"><label>Nom du site</label><input id="stNom" value="${esc(s.nom)}"></div>
  <div class="fld"><label>Statut</label><select id="stStat"><option value="actif"${s.statut==='actif'?' selected':''}>Actif</option><option value="archive"${s.statut!=='actif'?' selected':''}>Archivé</option></select></div></div>
  <h4>Nom de domaine</h4>
  <div class="cgrid2"><div class="fld"><label>Domaine principal</label><input id="stDom" value="${esc(s.domaine||'')}" placeholder="ex. ecole-edm.fr"></div>
  <div class="fld"><label>Dossier sur l'hébergement Hostinger</label><input id="stDir" value="${esc(s.dossier_ftp||'')}" placeholder="ex. /domains/ecole-edm.fr/public_html"></div></div>
  <div class="fld"><label>Domaines secondaires (redirigés vers le principal), séparés par des virgules</label><input id="stDom2" value="${esc((s.domaines_secondaires||[]).join(', '))}" placeholder="ex. www.ecole-edm.fr"></div>
  <details class="dnshelp"><summary>Comment connecter un nom de domaine ?</summary><div class="prose">${md(`1. Dans hPanel (Hostinger), ajoutez le domaine à votre hébergement (« Sites web » puis « Ajouter un site web »), ou créez un sous-domaine. Hostinger crée le dossier \`/domains/<domaine>/public_html\` : reportez-le ci-dessus.\n\n2. Si le domaine est enregistré chez Hostinger, ses DNS pointent déjà vers l'hébergement une fois le site ajouté. S'il pointe encore vers Wix, remplacez dans « Zone DNS » les enregistrements A et CNAME de Wix par ceux que Hostinger indique.\n\n3. Activez le certificat SSL gratuit du domaine dans hPanel (« Sécurité » puis « SSL »).\n\n4. Publiez le site depuis Cms-Edm : la génération dépose les pages dans le dossier indiqué.`)}</div></details>
  <h4>Membres</h4><table class="mtable">${(mem||[]).map(m=>`<tr><td>${esc(m.profiles?.email||m.user_id)}</td><td>${roleSel(m.role,`data-mrole="${m.user_id}"`)}</td><td><button class="linkbtn" data-mdel="${m.user_id}">Retirer</button></td></tr>`).join('')}
   ${(inv||[]).map(i=>`<tr><td>${esc(i.email)} <i class="help">(invitation en attente)</i></td><td>${ROLES[i.role]}</td><td><button class="linkbtn" data-idel="${esc(i.email)}">Annuler</button></td></tr>`).join('')}</table>
  <div class="invite"><input id="ivEmail" type="email" placeholder="adresse e-mail à inviter">${roleSel('redacteur','id="ivRole"')}<button class="abtn" id="ivAdd">Inviter</button></div>
  <p class="help">La personne invitée se connecte à Cms-Edm avec cette adresse (lien par e-mail ou mot de passe) : elle obtient alors l'accès au site. Rédacteur : modifie et soumet ; Validateur : publie ; Administrateur : publie, gère les membres et le domaine.</p>
  <p class="lmsg" id="stMsg"></p>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Fermer</button><button class="abtn pri" id="mOk">Enregistrer</button></div></div></div>`;
 const msg=t=>$('#stMsg').textContent=t;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mOk').onclick=async()=>{const dom=$('#stDom').value.trim().replace(/^https?:\/\//,'').replace(/\/$/,'')||null;
  const {error}=await sb.from('sites').update({nom:$('#stNom').value.trim(),statut:$('#stStat').value,domaine:dom,dossier_ftp:$('#stDir').value.trim()||null,domaines_secondaires:$('#stDom2').value.split(',').map(x=>x.trim()).filter(Boolean)}).eq('id',id);
  if(error){msg('Erreur : '+error.message);return;}$('#modal').innerHTML='';toast('Paramètres enregistrés');await loadSites();render();};
 document.querySelectorAll('[data-mrole]').forEach(x=>x.onchange=async()=>{const {error}=await sb.from('site_members').update({role:x.value}).eq('site_id',id).eq('user_id',x.dataset.mrole);msg(error?'Erreur : '+error.message:'Rôle modifié');});
 document.querySelectorAll('[data-mdel]').forEach(x=>x.onclick=async()=>{const {error}=await sb.from('site_members').delete().eq('site_id',id).eq('user_id',x.dataset.mdel);if(error)msg('Erreur : '+error.message);else openSettings(id);});
 document.querySelectorAll('[data-idel]').forEach(x=>x.onclick=async()=>{await sb.from('site_invites').delete().eq('site_id',id).eq('email',x.dataset.idel);openSettings(id);});
 $('#ivAdd').onclick=async()=>{const email=$('#ivEmail').value.trim().toLowerCase();if(!email)return;
  const {data:prof}=await sb.from('profiles').select('id').eq('email',email).maybeSingle();
  let error;if(prof)({error}=await sb.from('site_members').upsert({site_id:id,user_id:prof.id,role:$('#ivRole').value}));
  else({error}=await sb.from('site_invites').upsert({site_id:id,email,role:$('#ivRole').value,invited_by:SESSION.user.id}));
  if(error)msg('Erreur : '+error.message);else openSettings(id);};
}
async function openMessages(id){
 const s=SITES.find(x=>x.id===id);
 const {data,error}=await sb.from('messages').select('*').eq('site_slug',s.slug).order('created_at',{ascending:false}).limit(100);
 $('#modal').innerHTML=`<div class="modal"><div class="wide"><h3>Messages reçus : ${esc(s.nom)}</h3>
  ${error?'<p>Erreur : '+esc(error.message)+'</p>':(data||[]).length?`<div class="msgs">${data.map(m=>`<div class="msg${m.traite?' done':''}"><div><b>${esc((m.prenom||'')+' '+(m.nom||''))}</b> · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a> · ${esc(m.profil||'')}<span class="sp"></span><small>${fmtDate(m.created_at)}</small></div><p>${esc(m.message).replace(/\n/g,'<br>')}</p><button class="linkbtn" data-mt="${m.id}" data-v="${m.traite?0:1}">${m.traite?'Marquer non traité':'Marquer traité'}</button></div>`).join('')}</div>`:'<p class="help">Aucun message pour l\'instant. Les messages envoyés par le formulaire de contact du site apparaîtront ici.</p>'}
  <div class="actions"><span class="st"></span><button class="abtn pri" id="mCancel">Fermer</button></div></div></div>`;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 document.querySelectorAll('[data-mt]').forEach(b=>b.onclick=async()=>{await sb.from('messages').update({traite:b.dataset.v==='1'}).eq('id',b.dataset.mt);openMessages(id);});
}

/* ============ éditeur : chargement, brouillon, publication ============ */
async function openSite(slug,pg){
 if(SITE&&SITE.slug===slug&&CONTENT){if(pg)EDIT_PAGE=pg;return true;}
 if(!SITE||SITE.slug!==slug||!CONTENT){
  if(!SITES.length)await loadSites();
  const s=SITES.find(x=>x.slug===slug);if(!s){toast('Site introuvable ou accès refusé');location.hash='#/';return false;}
  SITE=s;ROLE=s._role;
  await loadTheme(s.theme||'edm');
  const {data,error}=await sb.from('contents').select('*').eq('site_id',s.id).single();
  if(error){toast('Erreur : '+error.message);return false;}
  CONTENT=data;
  draftMeta=data.draft?{at:data.draft_at,by:data.draft_by,statut:data.draft_status}:null;
  DRAFT=norm(clone(data.draft||data.published||ORIGIN_RAW));dirty=false;
  joinPresence();
 }
 EDIT_PAGE=pg||'accueil';return true;
}
async function saveDraft(statut){
 const {data,error}=await sb.rpc('save_draft',{p_site:SITE.id,p_content:DRAFT,p_status:statut});
 if(error){toast('Enregistrement refusé : '+error.message);return;}
 CONTENT.draft=clone(DRAFT);draftMeta={at:data,by:SESSION.user.id,statut};dirty=false;renderEdit();
 toast(statut==='en_validation'?'Brouillon soumis à validation':'Brouillon enregistré');
}
function openPublish(){
 $('#modal').innerHTML=`<div class="modal"><div><h3>Publier « ${esc(SITE.nom)} »</h3>
  <p>Le contenu est enregistré comme nouvelle version, puis le site est régénéré en pages statiques et déposé sur ${SITE.domaine?'<b>'+esc(SITE.domaine)+'</b>':'l\'hébergement (aucun domaine configuré pour l\'instant)'}. Comptez une à deux minutes.</p>
  <div class="fld"><label>Note de version</label><input id="note" placeholder="ex. Mise à jour des dates de réunion"></div>
  <div id="steps"></div>
  <div class="actions"><span class="st"></span><button class="abtn" id="mCancel">Annuler</button><button class="abtn pri" id="mGo">Publier</button></div></div></div>`;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 $('#mGo').onclick=async()=>{const go=$('#mGo');go.disabled=true;const st=$('#steps');
  st.innerHTML='<div class="line"><span class="dot run"></span>Enregistrement de la version</div>';
  const {data:v,error}=await sb.rpc('publish_site',{p_site:SITE.id,p_content:DRAFT,p_note:$('#note').value.trim()||null});
  if(error){st.innerHTML=`<p class="notice err">Publication refusée : ${esc(error.message)}</p>`;go.disabled=false;return;}
  CONTENT.published=clone(DRAFT);CONTENT.published_at=new Date().toISOString();CONTENT.draft=clone(DRAFT);draftMeta=null;dirty=false;
  st.innerHTML='<div class="line"><span class="dot ok"></span>Version '+v+' enregistrée</div><div class="line"><span class="dot run"></span>Lancement de la génération</div>';
  const {data:r,error:e2}=await sb.functions.invoke('deploy',{body:{site_id:SITE.id}});
  const ok=!e2&&r&&r.dispatched;
  st.innerHTML+='';st.lastElementChild.innerHTML=`<span class="dot ${ok?'ok':'run'}"></span>${ok?'Génération lancée : le site sera à jour dans une à deux minutes':'Génération programmée : elle démarrera automatiquement dans les quinze minutes'}`;
  go.textContent='Fermer';go.disabled=false;go.onclick=()=>{$('#modal').innerHTML='';renderEdit();};
  toast('Version '+v+' publiée');};
}
async function openHistory(){
 const [{data:vs},{data:bs}]=await Promise.all([sb.from('versions').select('id, note, by, at').eq('site_id',SITE.id).order('at',{ascending:false}).limit(40),sb.from('builds').select('*').eq('site_id',SITE.id).order('created_at',{ascending:false}).limit(10)]);
 const ids=[...new Set((vs||[]).map(v=>v.by).filter(Boolean))];const {data:ps}=ids.length?await sb.from('profiles').select('id, email').in('id',ids):{data:[]};const P={};(ps||[]).forEach(p=>P[p.id]=p.email);
 $('#modal').innerHTML=`<div class="modal"><div class="wide"><h3>Historique : ${esc(SITE.nom)}</h3>
  <h4>Générations du site</h4>${(bs||[]).length?`<div class="hist">${bs.map(b=>`<div><span class="bst b-${b.status}">${BSTAT[b.status]}</span><span>Version ${b.version_id||'-'} · ${fmtDate(b.created_at)}${b.log?`<br><small>${esc(b.log).slice(0,300)}</small>`:''}</span></div>`).join('')}</div>`:'<p class="help">Aucune génération pour l\'instant.</p>'}
  <h4>Versions publiées</h4>${(vs||[]).length?`<div class="hist">${vs.map(v=>`<div><span class="badge">v${v.id}</span><span><b>${esc(v.note||'Mise à jour')}</b><br><small>${fmtDate(v.at)} · ${esc(P[v.by]||'')}</small></span>${canPublish()?`<button class="abtn" data-rv="${v.id}">Restaurer</button>`:''}</div>`).join('')}</div>`:'<p class="help">Aucune version publiée.</p>'}
  <div class="actions"><span class="st"></span><button class="abtn pri" id="mCancel">Fermer</button></div></div></div>`;
 $('#mCancel').onclick=()=>$('#modal').innerHTML='';
 document.querySelectorAll('[data-rv]').forEach(b=>b.onclick=async()=>{const {data}=await sb.from('versions').select('content').eq('id',b.dataset.rv).single();if(!data)return;DRAFT=norm(clone(data.content));dirty=true;$('#modal').innerHTML='';applyCharte(DRAFT);renderEdit();toast('Version chargée dans le brouillon : vérifiez, puis publiez');});
}

/* ============ présence des autres rédacteurs ============ */
function joinPresence(){
 if(presenceCh){sb.removeChannel(presenceCh);presenceCh=null;}
 presenceCh=sb.channel('site-'+SITE.id,{config:{presence:{key:SESSION.user.id}}});
 presenceCh.on('presence',{event:'sync'},()=>{const st=presenceCh.presenceState();const others=Object.entries(st).filter(([k])=>k!==SESSION.user.id).map(([k,v])=>v[0]);
  const el=$('#presence');if(el)el.innerHTML=others.map(o=>`<span class="pav" title="${esc(o.email)} : ${esc(o.page||'')}">${esc((o.email||'?')[0].toUpperCase())}</span>`).join('')+(others.length?`<small>${others.length===1?'1 autre personne modifie ce site':others.length+' autres personnes modifient ce site'}</small>`:'');});
 presenceCh.subscribe(async s=>{if(s==='SUBSCRIBED')await presenceCh.track({email:ME.email,page:EDIT_PAGE});});
}

/* ============ aperçu (rendu public, sans outils d'édition) ============ */
let PREVIEW_ROUTE='accueil';
function renderPreview(){
 let rt=PREVIEW_ROUTE,anc='';
 if(rt.startsWith('section-')){anc=rt.slice(8);rt='accueil';}
 else if(rt.includes('--')){anc=rt.split('--')[1];}
 PREVIEW_SLUG=SITE.slug;MODE='preview';let html;try{html=renderPage(DRAFT,rt);}finally{MODE='spa';}
 const back=rt.split('--')[0];
 $('#app').className='';
 $('#app').innerHTML=`<div class="pvbar"><b>Aperçu</b><span>${dirty?'brouillon en cours, modifications non enregistrées comprises':(CONTENT&&CONTENT.published&&JSON.stringify(CONTENT.published)===JSON.stringify(DRAFT)?'identique à la version publiée':'brouillon non publié')}</span><span class="sp"></span><span class="help">Les liens fonctionnent comme sur le site publié.</span><a class="abtn pri" href="#/site/${esc(SITE.slug)}/${esc(back)}">← Revenir à l'édition</a></div><div class="site">${html}</div>`;
 applyCharte(DRAFT);
 if(anc){setTimeout(()=>{const t=document.getElementById('s-'+anc);if(t)scrollTo({top:t.getBoundingClientRect().top+scrollY-(document.querySelector('.sommaire')?110:60),behavior:'smooth'});},40);}else scrollTo(0,0);
}

/* ============ rendu général et routage ============ */
function render(){
 const app=$('#app');
 if(VIEW==='login'){app.className='';app.innerHTML=loginHTML();bindLogin();return;}
 if(VIEW==='newpwd'){app.className='';app.innerHTML=newPasswordHTML();$('#fNew').onsubmit=async e=>{e.preventDefault();if($('#nPwd').value!==$('#nPwd2').value){$('#lMsg').textContent='Les deux mots de passe ne sont pas identiques.';return;}const {error}=await sb.auth.updateUser({password:$('#nPwd').value});$('#lMsg').textContent=error?'Erreur : '+error.message:'Mot de passe enregistré.';if(!error){history.replaceState(null,'',location.pathname+'#/');setTimeout(()=>{VIEW='';route();},800);}};return;}
 if(VIEW==='sites'){app.className='';app.innerHTML=sitesHTML();bindSites();return;}
 if(VIEW==='preview'){renderPreview();return;}
 if(VIEW==='edit'){renderEdit();applyCharte(DRAFT);presenceCh&&presenceCh.track({email:ME.email,page:EDIT_PAGE});return;}
 app.innerHTML='<p style="padding:40px">Chargement...</p>';
}
async function route(){
 const h=location.hash||'#/';
 if((h.startsWith('#/motdepasse')||new URLSearchParams(location.search).get('mdp')==='1')&&SESSION){VIEW='newpwd';render();return;}
 if(!SESSION){VIEW='login';render();return;}
 const pv=h.match(/^#\/apercu\/([a-z0-9-]+)\/(.+)$/);
 if(pv){if(await openSite(pv[1],EDIT_PAGE)){PREVIEW_ROUTE=decodeURIComponent(pv[2]);VIEW='preview';render();}return;}
 const m=h.match(/^#\/site\/([a-z0-9-]+)(?:\/(.+))?$/);
 if(m){if(dirty&&SITE&&SITE.slug!==m[1]&&!confirmLeave())return;if(await openSite(m[1],decodeURIComponent(m[2]||'accueil'))){VIEW='edit';section=EDIT_PAGE;render();}return;}
 if(VIEW==='edit'&&dirty){if(!confirmLeave()){history.replaceState(null,'','#/site/'+SITE.slug+'/'+EDIT_PAGE);return;}}
 if(presenceCh){sb.removeChannel(presenceCh);presenceCh=null;}
 SITE=null;CONTENT=null;DRAFT=null;dirty=false;
 VIEW='sites';await loadSites();render();
}
function confirmLeave(){return window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?');}
addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
addEventListener('hashchange',route);

/* widgets du site (carrousel, onglets, galerie) dans l'éditeur */
document.addEventListener('click',e=>{
 const q=e.target.closest('[data-tq],[data-tqi]');
 if(q){e.preventDefault();const car=q.closest('.qcar');const sl=[...car.querySelectorAll('.qslide')];let i=sl.findIndex(x=>x.classList.contains('on'));i=q.dataset.tqi!=null?+q.dataset.tqi:(i+ +q.dataset.tq+sl.length)%sl.length;sl.forEach((x,k)=>x.classList.toggle('on',k===i));car.querySelectorAll('.qdots button').forEach((x,k)=>x.classList.toggle('on',k===i));return;}
 const tb=e.target.closest('[data-tab]');
 if(tb){e.preventDefault();const card=tb.closest('[data-tabs]');const k=+tb.dataset.tab;card.querySelectorAll('.ptabs button').forEach((x,j)=>x.classList.toggle('on',j===k));card.querySelectorAll('.ptab').forEach((x,j)=>x.classList.toggle('on',j===k));return;}
});
document.addEventListener('submit',e=>{if(e.target.matches('[data-contact]')){e.preventDefault();toast('Formulaire désactivé dans l\'éditeur');}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal').innerHTML){$('#modal').innerHTML='';return;}
 if(e.key==='Escape'&&document.activeElement?.closest('[data-e],.rtb')){rtbHide();document.activeElement.blur();getSelection().removeAllRanges();}});
document.getElementById('modal').addEventListener('click',e=>{if(e.target.classList.contains('modal')&&!$('#mGo')?.disabled)$('#modal').innerHTML='';});

/* ============ démarrage ============ */
async function setSession(s){
 SESSION=s;
 if(s){const {data}=await sb.from('profiles').select('*').eq('id',s.user.id).maybeSingle();ME=data||{id:s.user.id,email:s.user.email,is_superadmin:false};}
 else ME=null;
}
(async()=>{
 bindEditOnce();
 const {data:{session}}=await sb.auth.getSession();await setSession(session);await route();
 sb.auth.onAuthStateChange(async(ev,s)=>{if(ev==='PASSWORD_RECOVERY'){await setSession(s);VIEW='newpwd';render();return;}
  if(ev==='SIGNED_IN'&&!SESSION){await setSession(s);await route();}else if(ev==='SIGNED_OUT'){await setSession(null);SITE=null;CONTENT=null;route();}});
})();
