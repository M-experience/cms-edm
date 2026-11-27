/* Cms-Edm : fil LinkedIn natif, alimenté par les données SociableKIT (synchronisées par leur service),
   dédoublonné, classé par année, avec posts masquables depuis l'éditeur. */
(function(){
const FEED='https://data.accentapi.com/feed/';
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const key=u=>{const m=String(u||'').match(/(\d{15,})/);return m?m[1]:u;};
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function fdate(s){const d=new Date(String(s).replace(' ','T'));return isNaN(d)?'':d.getDate()+' '+MOIS[d.getMonth()]+' '+d.getFullYear();}
function prep(posts){
 // regroupe les republications d'un même post (même adresse) et garde l'original
 const by={};posts.forEach(p=>{const k=key(p.post_url);const cur=by[k];if(!cur||(cur.reposted==='1'&&p.reposted!=='1'))by[k]=p;});
 return Object.values(by).sort((a,b)=>String(b.post_date_time).localeCompare(String(a.post_date_time)));}
function card(p,edit,hidden){
 const txt=(p.raw_text||p.description_raw||'').trim();const short=txt.length>320?txt.slice(0,300).replace(/\s+\S*$/,'')+'…':txt;
 const img=p.thumbnail_url||p.thumbnail||'';
 return `<article class="lin-card${hidden?' lin-hidden':''}" data-id="${E(p.id)}">
  ${img?`<a class="lin-img" href="${E(p.post_url)}" target="_blank" rel="noopener"><img src="${E(img)}" alt="" loading="lazy"></a>`:''}
  <div class="lin-body"><div class="lin-meta"><span class="li-mark">in</span><time>${fdate(p.post_date_time)}</time>${p.reposted==='1'?'<span class="lin-rep">Republication</span>':''}</div>
  <p>${E(short).replace(/\n/g,'<br>')}</p>
  <div class="lin-foot"><a href="${E(p.post_url)}" target="_blank" rel="noopener">Lire sur LinkedIn →</a><span>${+p.likes_count?'♥ '+E(p.likes_count):''}${+p.comments_count?' · 💬 '+E(p.comments_count):''}</span></div>
  ${edit?`<button type="button" class="lin-mask" data-limask="${E(p.id)}">${hidden?'Afficher sur le site':'Masquer sur le site'}</button>`:''}</div></article>`;}
async function init(el){
 if(el.dataset.ready)return;el.dataset.ready='1';
 const id=el.dataset.sk,edit=!!el.closest('.editing');let masques=[];try{masques=JSON.parse(el.dataset.masques||'[]');}catch(e){}
 let data=null;try{const r=await fetch(FEED+id+'.json?nocache='+Math.floor(Date.now()/600000));data=r.ok?await r.json():null;}catch(e){}
 if(!data||!Array.isArray(data.posts)){el.innerHTML='<p class="lin-empty">Les publications LinkedIn ne peuvent pas être affichées pour le moment.</p>';return;}
 let posts=prep(data.posts);if(!edit)posts=posts.filter(p=>!masques.includes(String(p.id)));
 const years=[...new Set(posts.map(p=>String(p.post_date_time).slice(0,4)))].filter(Boolean);
 let cur=el.dataset.year&&years.includes(el.dataset.year)?el.dataset.year:years[0];
 const draw=()=>{el.dataset.year=cur;
  el.innerHTML=`<div class="lin-years" role="tablist">${years.map(y=>`<button type="button" role="tab" class="${y===cur?'on':''}" data-y="${y}">${y}<small>${posts.filter(p=>String(p.post_date_time).startsWith(y)&&(edit?!masques.includes(String(p.id)):true)).length}</small></button>`).join('')}</div>
  <div class="lin-grid">${posts.filter(p=>String(p.post_date_time).startsWith(cur)).map(p=>card(p,edit,masques.includes(String(p.id)))).join('')}</div>`;
  el.querySelectorAll('[data-y]').forEach(b=>b.onclick=()=>{cur=b.dataset.y;draw();});};
 draw();}
window.liFeedInit=function(root){(root||document).querySelectorAll('.li-native[data-sk]').forEach(init);};
if(document.readyState!=='loading')window.liFeedInit();else document.addEventListener('DOMContentLoaded',()=>window.liFeedInit());
})();
