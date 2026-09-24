function chordToneIvs(ch){
  if(!ch||!ch.root||ch.kind==="nc")return [];
  const q=String(ch.quality||"").toLowerCase();
  if(ch.kind==="dim"||/^dim/.test(q))return /7/.test(q)?[0,3,6,9]:[0,3,6];
  if(ch.kind==="aug"||/^aug|^\+/.test(q))return [0,4,8];
  if(ch.kind==="m7b5"||/m7b5/.test(q))return [0,3,6,10];
  if(ch.kind==="sus2"||/sus2/.test(q))return [0,2,7];
  if(/7sus|sus7/.test(q)||(ch.kind==="sus4"&&/7/.test(q)))return [0,5,7,10];
  if(ch.kind==="sus4"||/^sus/.test(q))return [0,5,7];
  if(/maj9/.test(q))return [0,4,7,11,2];
  if(/maj7|maj/.test(q))return [0,4,7,11];
  if(/m11/.test(q))return [0,3,7,10,5];
  if(/m9/.test(q))return [0,3,7,10,2];
  if(/m6/.test(q))return [0,3,7,9];
  if(/^m7/.test(q)||(ch.kind==="min"&&/7/.test(q)))return [0,3,7,10];
  if(ch.kind==="min")return [0,3,7];
  if(/7#9/.test(q))return [0,4,7,10,3];
  if(/13/.test(q))return [0,4,7,10,9];
  if(/11/.test(q))return [0,4,7,10,5];
  if(/9/.test(q)&&!/add/.test(q)&&!/^2$/.test(q))return [0,4,7,10,2];
  if(/add9|^2$/.test(q))return [0,4,7,2];
  if(/^6/.test(q))return [0,4,7,9];
  if(/^7/.test(q)||ch.kind==="dom")return [0,4,7,10];
  return [0,4,7];
}
function closeStack(ivs){
  const u=[...new Set(ivs.map(n=>((n%12)+12)%12))].sort((a,b)=>a-b);
  if(!u.length)return [];
  const out=[u[0]];
  for(let i=1;i<u.length;i++){
    let n=u[i];
    while(n<=out[out.length-1])n+=12;
    out.push(n);
  }
  return out;
}
function invertUp(stack){
  if(stack.length<2)return stack.slice();
  const top=stack[0]+12;
  return stack.slice(1).concat(top);
}
function pianoCards(ch,name){
  const ivs=chordToneIvs(ch);
  if(!ivs.length)return [];
  const root=noteIndex(ch.root);
  let stack=closeStack(ivs).map(n=>root+n);
  const cards=[];
  const n=Math.min(stack.length,4);
  for(let i=0;i<n;i++){
    cards.push({label:i===0?name:name+" Inversion "+i,keys:stack.slice()});
    stack=invertUp(stack);
  }
  if(ch.bass){
    const b=noteIndex(ch.bass);
    let slash=closeStack(ivs).map(n=>root+n);
    while(slash[0]%12!==b)slash=invertUp(slash);
    cards.unshift({label:name,keys:slash});
  }
  const third=ivs.find(x=>x===3||x===4);
  const seventh=ivs.find(x=>x===10||x===11||x===9);
  const ninth=ivs.find(x=>x===2);
  if(seventh!=null&&third!=null){
    cards.push({label:name+" shell",keys:closeStack([0,seventh,third+12]).map(n=>root+n)});
  }
  if(third!=null&&seventh!=null&&ninth!=null){
    cards.push({label:name+" color",keys:closeStack([third,seventh,ninth]).map(n=>root+n)});
  }
  return cards;
}
function drawTwoOctaves(keys){
  const wrap=document.createElement("div");
  wrap.className="os-kb";
  const whites=document.createElement("div");whites.className="os-w";
  const blacks=document.createElement("div");blacks.className="os-b";
  const W=[0,2,4,5,7,9,11];
  const set=new Set(keys.map(k=>((k%24)+24)%24));
  for(let oct=0;oct<2;oct++){
    W.forEach(pc=>{
      const midi=oct*12+pc;
      const d=document.createElement("div");
      d.className="os-white"+(set.has(midi)||set.has(midi+24)?" on":"");
      whites.appendChild(d);
    });
  }
  const last=document.createElement("div");
  last.className="os-white"+(set.has(24)||set.has(0)?" on":"");
  whites.appendChild(last);
  const blackPat=[1,3,null,6,8,10,null];
  for(let oct=0;oct<2;oct++){
    blackPat.forEach(pc=>{
      if(pc==null)return;
      const midi=oct*12+pc;
      const d=document.createElement("div");
      d.className="os-black"+(set.has(midi)?" on":"");
      const whiteIndex=oct*7+(pc===1?0:pc===3?1:pc===6?3:pc===8?4:5);
      d.style.left=((whiteIndex+0.72)/15*100)+"%";
      blacks.appendChild(d);
    });
  }
  wrap.append(whites,blacks);
  return wrap;
}
function renderPianoSheet(){
  const box=$("#pianoKb");if(!box)return;
  box.innerHTML="";
  const title=$("#pianoName");if(title)title.textContent=pianoState.name+" on Piano";
  pianoState.cards.forEach(card=>{
    const fig=document.createElement("figure");
    fig.className="os-card";
    fig.appendChild(drawTwoOctaves(card.keys));
    const cap=document.createElement("figcaption");
    cap.textContent=card.label;
    fig.appendChild(cap);
    box.appendChild(fig);
  });
}
let pianoState={cards:[],name:""};
function pianoOpen(){const s=$("#pianoSheet");return s&&!s.hidden;}
function openPiano(name){
  const ch=parseChord(name);
  const cards=pianoCards(ch,name);
  if(!cards.length)return;
  pianoState={cards,name};
  const s=$("#pianoSheet");if(s)s.hidden=false;
  renderPianoSheet();
}
function closePiano(){const s=$("#pianoSheet");if(s)s.hidden=true;}
(function(){
  function chordName(el){return el.textContent.replace(/\u00a0/g,"").trim();}
  document.addEventListener("click",e=>{
    const el=e.target&&e.target.closest?e.target.closest("#chartBody .ch"):null;
    if(!el)return;
    const name=chordName(el);
    if(!name)return;
    e.preventDefault();
    openPiano(name);
  });
  function hook(){const c=document.querySelector("#pianoClose");if(c)c.onclick=closePiano;}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",hook);else hook();
})();
