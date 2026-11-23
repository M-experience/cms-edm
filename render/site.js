// Cms-Edm : interactions des sites publiés (carrousel, onglets, galerie, formulaire de contact)
document.addEventListener('click',function(e){
 var q=e.target.closest('[data-tq],[data-tqi]');
 if(q){e.preventDefault();var car=q.closest('.qcar');var sl=[].slice.call(car.querySelectorAll('.qslide'));var i=sl.findIndex(function(x){return x.classList.contains('on')});i=q.dataset.tqi!=null?+q.dataset.tqi:(i+(+q.dataset.tq)+sl.length)%sl.length;sl.forEach(function(x,k){x.classList.toggle('on',k===i)});car.querySelectorAll('.qdots button').forEach(function(x,k){x.classList.toggle('on',k===i)});return;}
 var tb=e.target.closest('[data-tab]');
 if(tb){e.preventDefault();var card=tb.closest('[data-tabs]');var k=+tb.dataset.tab;card.querySelectorAll('.ptabs button').forEach(function(x,j){x.classList.toggle('on',j===k)});card.querySelectorAll('.ptab').forEach(function(x,j){x.classList.toggle('on',j===k)});return;}
 var gi=e.target.closest('[data-gi],[data-gnext]');
 if(gi){var g=gi.closest('.lgal');var th=[].slice.call(g.querySelectorAll('[data-gi]'));var n=+(g.dataset.gal||0);n=gi.dataset.gi!=null?+gi.dataset.gi:(n+1)%th.length;g.dataset.gal=n;g.querySelector('.lmain img').src=th[n].src;}
});
document.addEventListener('submit',function(e){
 var f=e.target;if(!f.matches('[data-contact]'))return;e.preventDefault();
 var d=new FormData(f),btn=f.querySelector('button');btn.disabled=true;btn.textContent='Envoi...';
 fetch(window.CMS.url+'/rest/v1/messages',{method:'POST',headers:{apikey:window.CMS.key,Authorization:'Bearer '+window.CMS.key,'Content-Type':'application/json',Prefer:'return=minimal'},
  body:JSON.stringify({site_slug:window.CMS.site,prenom:d.get('prenom'),nom:d.get('nom'),email:d.get('email'),profil:d.get('profil'),message:d.get('message')})})
 .then(function(r){if(!r.ok)throw new Error(r.status);f.outerHTML='<div class="notice">Merci, votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.</div>';})
 .catch(function(){btn.disabled=false;btn.textContent='Envoyer';alert('L\'envoi a échoué. Écrivez-nous directement par e-mail.');});
});
// ancre d'arrivée sous la barre de sommaire
if(location.hash&&location.hash.indexOf('#s-')===0){setTimeout(function(){var t=document.getElementById(location.hash.slice(1));if(t){var y=t.getBoundingClientRect().top+scrollY-(document.querySelector('.sommaire')?70:10);scrollTo({top:y});}},60);}
