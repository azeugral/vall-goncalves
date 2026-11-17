// TRABALHOS
const P=window.PECAS,g=document.getElementById('grade'),fil=document.getElementById('filtros'),mais=document.getElementById('verMais'),MOSTRA=24;
const CAT=[['*','Todos'],['f','Floral'],['o','Borboletas'],['b','Bichos'],['r','Rostos e figuras'],['d','Delicadas'],['e','Escritas']];
let filtro='*',limite=MOSTRA,lista=[];
CAT.forEach(([k,n])=>{const b=document.createElement('button');b.type='button';b.textContent=n;b.dataset.k=k;b.setAttribute('aria-pressed',k==='*');b.onclick=()=>{filtro=k;limite=MOSTRA;fil.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));monta()};fil.appendChild(b)});
function monta(){
  lista=P.filter(p=>filtro==='*'||p[1]===filtro);
  g.innerHTML='';
  lista.slice(0,limite).forEach(([c,,t],i)=>{
    const b=document.createElement('button');b.type='button';b.className='item';b.setAttribute('aria-label','Ampliar: '+t);
    const im=document.createElement('img');im.src='assets/img/p/'+c+'.webp';im.alt=t+', tatuagem da Vall Gonçalves';im.width=960;im.height=1200;im.draggable=false;
    b.appendChild(im);b.onclick=()=>abre(i);g.appendChild(b);
    requestAnimationFrame(()=>setTimeout(()=>b.classList.add('on'),Math.min(i,12)*25));
  });
  mais.hidden=lista.length<=limite;
}
mais.onclick=()=>{limite+=24;monta()};
monta();

// LIGHTBOX
const lb=document.getElementById('lb'),lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap');
let li=0,ultimoFoco=null;
function abre(i){li=i;ultimoFoco=document.activeElement;mostraLb();lb.hidden=false;requestAnimationFrame(()=>lb.classList.add('on'));document.body.style.overflow='hidden';document.getElementById('lbX').focus()}
function mostraLb(){const [c,,t]=lista[li];lbImg.src='assets/img/p/'+c+'.webp';lbImg.alt=t;lbCap.textContent=t}
function fecha(){lb.classList.remove('on');setTimeout(()=>{lb.hidden=true},300);document.body.style.overflow='';if(ultimoFoco)ultimoFoco.focus()}
const passa=d=>{li=(li+d+lista.length)%lista.length;mostraLb()};
document.getElementById('lbX').onclick=fecha;
document.getElementById('lbAnt').onclick=()=>passa(-1);
document.getElementById('lbProx').onclick=()=>passa(1);
lb.addEventListener('click',e=>{if(e.target===lb)fecha()});
document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')fecha();if(e.key==='ArrowLeft')passa(-1);if(e.key==='ArrowRight')passa(1)});
let tx=null;lb.addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});
lb.addEventListener('touchend',e=>{if(tx===null)return;const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)passa(d<0?1:-1);tx=null});
const TEMA={f:'Floral',o:'Borboleta',b:'Bicho com flores',r:'Rosto ou figura',d:'Delicada pequena',e:'Escrita ou homenagem'};
document.getElementById('lbQuero').onclick=()=>{
  const [,k,t]=lista[li];fecha();
  const r=document.querySelector('#fTema input[value="'+TEMA[k]+'"]');if(r)r.checked=true;
  const id=document.getElementById('fIdeia');id.value='Quero uma parecida com a "'+t+'" que vi no site. ';
  setTimeout(()=>{document.getElementById('form').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>id.focus({preventScroll:true}),600)},320);
};

// PEDIDO -> WHATSAPP
(function(){
  const fm=document.getElementById('form'),nome=document.getElementById('fNome'),erro=document.getElementById('fErro');
  const NUM='5543999631074';
  nome.addEventListener('input',()=>{if(nome.value.trim())erro.hidden=true});
  fm.addEventListener('submit',e=>{
    e.preventDefault();
    const n=nome.value.trim();
    if(!n){erro.hidden=false;nome.focus();return}
    const v=s=>(fm.querySelector(s)||{}).value||'';
    const tema=(fm.querySelector('input[name=tema]:checked')||{}).value;
    const cob=(fm.querySelector('input[name=cob]:checked')||{}).value;
    const L=['Olá, Vall! Sou *'+n+'* e quero um orçamento.',''];
    if(tema)L.push('*Tema:* '+tema);
    if(cob==='Sim')L.push('*Cobertura:* sim, cobrir outra tattoo');
    if(v('#fLocal').trim())L.push('*Local:* '+v('#fLocal').trim());
    if(v('#fTam'))L.push('*Tamanho:* '+v('#fTam'));
    if(v('#fDisp'))L.push('*Disponibilidade:* '+v('#fDisp'));
    if(v('#fIdeia').trim())L.push('*Ideia:* '+v('#fIdeia').trim());
    L.push('','(pedido enviado pelo site)');
    window.open('https://wa.me/'+NUM+'?text='+encodeURIComponent(L.join('\n')),'_blank','noopener');
  });
})();

// ENTRADA AO ROLAR (só subida leve)
(function(){
  if(!('IntersectionObserver' in window))return;
  const els=document.querySelectorAll('.sec-cab,.cic figure,.hom figure,.sobre>*,.titulos,.est>*,.passos li,.galeria .qd,.faq');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  els.forEach(el=>{el.classList.add('surge');io.observe(el)});
})();
